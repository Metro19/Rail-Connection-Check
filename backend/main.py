from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Sequence, Union

import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, select, text, and_
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

import datafetch
from datafetch import get_data, engine
from db import Route, Stop, Station

# CORS setup
origins = [
   ' http://localhost:5173'
]

scheduler = BackgroundScheduler()
trigger = IntervalTrigger(hours=1,
                          start_date='2025-01-01 00:00:00')  # <-- CHANGED LINE (run every 24 hours, starting in 2025)
scheduler.add_job(get_data, trigger)
scheduler.start()

# setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Ensure the scheduler shuts down properly on application exit.
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    scheduler.shutdown()


def generate_train_code(starting_code: str, starting_stop_departure: str) -> str:
    """
    Generate a unique train code based on starting station code and date of departure

    :param starting_code: Train starting station code
    :param starting_stop_departure: Departure time of the starting station in ISO format
    :return: String representing the unique train code
    """

    start_departure = datetime.fromisoformat(starting_stop_departure)

    return f"{starting_code}_{start_departure.strftime('%Y%m%d')}"

@app.get("/ping")
def read_root():
    return {"success": True}

@app.get("/trains")
def get_trains():
    all_routes = []
    with Session(engine) as session:
        for route in session.scalars(select(Route)):
            all_routes.append((route.num, route.name))

    return all_routes

@app.get("/intersecting_routes")
def intersecting_routes_endpoint(route_one: str):
    """
    Check to see which trains share at least one station with each other

    :param route_one: Route number of first train (e.g. 7)
    :return: List of routes
    """

    with Session(engine) as session:
        result = session.execute(text('''
                         SELECT r2.route_id, r.name
                         FROM station
                                  INNER JOIN route_stop AS r1 ON r1.station_code = station.stop_code
                                  INNER JOIN route_stop AS r2 ON r2.station_code = r1.station_code
                                  INNER JOIN route AS r ON r.num = r2.route_id
                         WHERE r1.route_id = '1' AND r2.route_id != r1.route_id
                         GROUP BY r2.route_id, r.name
                         ORDER BY r2.route_id::int;
        ''')).all()

        return [[route[0], route[1]] for route in result]



@app.get("/compare_trains")
def compare_trains_endpoint(route_one: str, route_two: str):
    """
    Compare two trains at a given station over the past 7 days

    :param route_one: Route number of first train (e.g. 7)
    :param route_two: Route number of second train (e.g. 504)
    :param station: Station code of the station to compare at (e.g. ROC)
    :return: Error or data of trains
    """

    # get shared stations
    shared_stations = intersecting_stations(route_one, route_two)

    # check for errors
    if len(shared_stations) == 0:
        raise HTTPException(status_code=400, detail="No Shared Stations")
    if len(shared_stations) > 1:
        raise HTTPException(status_code=400, detail="More Than One Shared Station")

    station = shared_stations[0][1]

    result = compare_trains(route_one, route_two, station)
    if result is None:
        raise HTTPException(status_code=500, detail="Error Processing Data")


    # format data
    r1, r2 = result
    r1_stops, r1_num = r1
    r2_stops, r2_num = r2

    r1_serialized = [stop.to_json() if stop else None for stop in r1_stops]
    r2_serialized = [stop.to_json() if stop else None for stop in r2_stops]

    # get route names from database
    r1_name = "Unknown Route"
    r2_name = "Unknown Route"
    station_name = shared_stations[0][0]
    with Session(engine) as session:
        r1_obj = session.scalar(select(Route).where(Route.num == r1_num))
        r2_obj = session.scalar(select(Route).where(Route.num == r2_num))

    if r1_obj:
        r1_name = r1_obj.name
    if r2_obj:
        r2_name = r2_obj.name

    return {
        "route_one_num": r1_num,
        "route_one_name": r1_name,
        "route_one": r1_serialized,

        "route_two_num": r2_num,
        "route_two_name": r2_name,
        "route_two": r2_serialized,

        "station": station,
        "station_name": station_name
    }

def compare_trains(route_one: str, route_two: str, station: str) -> tuple[tuple[List[Union[Stop, None]], str],
tuple[List[Union[Stop, None]], str]] | None:
    """
    Compare two trains at a given station over the past 28 days

    :param route_one: Route number of first train (e.g. 7)
    :param route_two: Route number of second train (e.g. 504)
    :param station: Station code of the station to compare at (e.g. ROC)
    :return: Error or data of trains
    """

    route_one_number = route_one
    route_two_number = route_two

    route_one_trains = list(get_departures_one_train(route_one, station))
    route_two_trains = list(get_departures_one_train(route_two, station))

    # check to see who is first to arrive
    if (len(route_one_trains) > 0 and len(route_two_trains) > 0) and route_one_trains[0].sch_arr > route_two_trains[0].sch_arr:
        route_one_trains, route_two_trains = route_two_trains, route_one_trains
        route_one_number, route_two_number = route_two_number, route_one_number

    # check if lists are already complete
    if len(route_one_trains) == len(route_two_trains) == 28:
        return (route_one_trains, route_one_number), (route_two_trains, route_two_number)

    # fill gaps
    r1return = []
    r2return = []
    lastR1 = 0
    lastR2 = 0
    for i in range(28):
        curr_date = (datetime.now(tz=pytz.timezone("America/New_York")) - timedelta(days=i))
        curr_day = curr_date.day
        curr_month = curr_date.month

        # check if the next train is on the target day
        if route_one_trains and route_one_trains[lastR1].sch_arr.day == curr_day and route_one_trains[lastR1].sch_arr.month == curr_month:
            r1return.append(route_one_trains[lastR1])
            if lastR1 < len(route_one_trains) - 1:
                lastR1 += 1
        else:
            r1return.append(None)

        # check if the next train is on the target day
        if route_two_trains and route_two_trains[lastR2].sch_arr.day == curr_day and route_two_trains[lastR2].sch_arr.month == curr_month:
            r2return.append(route_two_trains[lastR2])
            if lastR2 < len(route_two_trains) - 1:
                lastR2 += 1
        else:
            r2return.append(None)


    return (r1return, route_one_number), (r2return, route_two_number)


def get_departures_one_train(route: str, station: str) -> Sequence[Stop]:
    """
    Get all the departures of one train at a given station over the past 7 days

    :param route: Route number of the train (e.g. 7)
    :param station: Station code of the station to get departures from (e.g. ROC)
    :return: List of Stop objects
    """

    with Session(engine) as session:
        thirty_days_ago = datetime.now().replace(hour=23, minute=59, second=59, tzinfo=pytz.timezone("US/Eastern")) - timedelta(days=28)
        now = datetime.now()
        departures = session.execute(
            select(Stop)
            .where(and_(
                Stop.route_id == route,
                Stop.station_id == station,
                Stop.sch_dep >= thirty_days_ago,
                Stop.sch_dep <= now)
            )
            .order_by(Stop.sch_dep.desc())
        ).scalars().all()

        print(departures)

        return departures

def intersecting_stations(route_one: str, route_two: str):
    """
    Get all stations that are on both routes

    :param route_one: Route number of first train (e.g. 7)
    :param route_two: Route number of second train (e.g. 504)
    :return: List of intersecting stations
    """

    all_stations = []
    with Session(engine) as session:
        result = session.execute(text('''
                                      SELECT station.name, station.stop_code
                                      FROM station
                                               INNER JOIN route_stop AS r1 ON r1.station_code = station.stop_code
                                               INNER JOIN route_stop AS r2 ON r2.station_code = r1.station_code
                                      WHERE r1.route_id = :route_1 AND r2.route_id = :route_2
                                      GROUP BY station.name, station.stop_code;
                                      '''), {"route_1": route_one, "route_2": route_two}).all()

        for r in result:
            all_stations.append((r[0], r[1]))

    return all_stations

if __name__ == "__main__":
    import uvicorn

    # datafetch.get_data()
    uvicorn.run(app, host="0.0.0.0", port=8000)