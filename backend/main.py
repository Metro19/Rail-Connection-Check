import json
from datetime import datetime
from typing import List

from fastapi import FastAPI
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session

from db import Route, Stop

# setup
app = FastAPI()
engine = create_engine("")

# TODO: Combine with other file
def generate_train_code(starting_code: str, starting_stop_departure: str) -> str:
    """
    Generate a unique train code based on starting station code and date of departure

    :param starting_code: Train starting station code
    :param starting_stop_departure: Departure time of the starting station in ISO format
    :return: String representing the unique train code
    """

    start_departure = datetime.fromisoformat(starting_stop_departure)

    return f"{starting_code}_{start_departure.strftime('%Y%m%d')}"

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/trains")
def get_trains():
    all_routes = []
    with Session(engine) as session:
        for route in session.scalars(select(Route)):
            all_routes.append((route.num, route.name))

    return all_routes

@app.get("/intersecting_stations")
def intersecting_stations(route_one: str, route_two: str):
    print("IS")

    all_stations = []
    with Session(engine) as session:
        result = session.execute(text('''
                                 SELECT station.name, station.stop_code
                                 FROM station
                                 INNER JOIN route_stop AS r1 ON r1.station_code = station.stop_code
                                 INNER JOIN route_stop AS r2 ON r2.station_code = r1.station_code
                                 WHERE r1.route_id = :route_1 AND r2.route_id = :route_2;
                                 '''), {"route_1": route_one, "route_2": route_two}).all()

        for r in result:
            all_stations.append((r[0], r[1]))

    return all_stations

def compare_trains(route_one: str, route_two: str, station: str):
    pass

def get_departures_one_train(route: str, station: str) -> List[Stop]:
    # with Session(engine) as session:
    #     session.scalars()
