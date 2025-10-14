from datetime import datetime
from typing import List, Optional

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from pytz import timezone

from db import Route, Base, RouteStop, Station, Stop, Train
from fetch_amtrak_json import fetch_json

engine = create_engine("postgresql+psycopg://postgres:admin@localhost/RailConnectionCheck")
Base.metadata.create_all(engine)

scheduler = BackgroundScheduler()

def generate_train_code(starting_code: str, starting_stop_departure: str) -> str:
    """
    Generate a unique train code based on starting station code and date of departure

    :param starting_code: Train starting station code
    :param starting_stop_departure: Departure time of the starting station in ISO format
    :return: String representing the unique train code
    """

    start_departure = datetime.fromisoformat(starting_stop_departure)

    return f"{starting_code}_{start_departure.strftime('%Y%m%d')}"

def to_time(time_str: str, tz: str = "US/Eastern") -> Optional[datetime]:
    """
    Convert ISO format time string to datetime object if applicable

    :param time_str: ISO format time string in UTC
    :param tz: Timezone to convert to
    :return: Resulting datetime object or None
    """

    if time_str:
        # don't ask me why but VIA rail data is all in UTC
        # so we need to convert that

        if "Z" in time_str:
            raw_datetime = datetime.fromisoformat(time_str)
            raw_datetime = raw_datetime.replace(tzinfo=timezone("UTC"))
            local_tz = timezone(tz)

            return raw_datetime.astimezone(local_tz)

        else:
            return datetime.fromisoformat(time_str)

        return datetime.fromisoformat(time_str)

    return None

def store_route_info(data: dict):
    """

    :param data:
    :return:
    """

    # make one call to get all the route codes in the database
    all_routes = []
    all_stations = []
    with Session(engine) as session:
        all_route_objects = session.scalars(select(Route))
        all_station_objects = session.scalars(select(Station))

        # extract route codes
        for r in all_route_objects:
            all_routes.append(r.num)

        # extract station codes
        for s in all_station_objects:
            all_stations.append(s.stop_code)

    # save each route to database
    new_objects = []
    for route in data.keys():

        # check if route is in saved data
        if route not in all_routes:
            new_objects.append(Route(num=data["trainNum"], name=data["routeName"]))

        all_routes.append(route)
        new_objects += store_station_info(data[route][0], all_stations)

    # save all new objects
    with Session(engine) as session:
        session.add_all(new_objects)
        session.commit()


def store_station_info(data: dict, all_station_codes: List[str]) -> list:
    """
    Store the info of one station

    :param data: Station object from API
    :param all_station_codes: List of existing stations
    :return: List of Stations and RouteStops to add to DB
    """

    new_objects: list = []

    for station in data["stations"]:
        # check if station has already been created
        if station["code"] not in all_station_codes:
            all_station_codes.append(station["code"])

            # create station object
            new_objects.append(Station(stop_code=station["code"], name=station["name"]))

        # create connector between route and station
        new_objects.append(RouteStop(route_id=data["trainNum"], station_code=station["code"]))

    return new_objects


def store_train_info(data: dict):
    """
    Store the info of all live trains

    :param data: Train data from API
    :return: None
    """

    with Session(engine) as session:
        for route in data.keys():
            # get each train
            for train in data[route]:

                # store train object
                store_one_train(session, train)

                train_code = generate_train_code(train["trainNum"], train["stations"][0]["schDep"])

                # save each stop object
                for station in train["stations"]:
                    store_one_station_time(session, train_code, station)

        # commit
        session.commit()


def store_one_train(session: Session, train_obj: dict):
    """
    Store the info of one live train object

    :param session: SQLAlchemy session
    :param train_obj: Train object from API to store
    :return: None
    """

    train_code = generate_train_code(train_obj["trainNum"], train_obj["stations"][0]["schDep"])
    train_val = session.scalar(select(Train).where(Train.train_id == train_code))
    train = Train()

    # check if train is already stored
    if train_val is not None:
        train = train_val

    # store values
    train.train_id = train_code
    train.route_id = train_obj["trainNum"]

    session.add(train)


def store_one_station_time(session: Session, train_code: str, stop_obj: dict):
    """
    Store one train visit to a station

    :param session: SQLAlchemy
    :param train_code:
    :param stop_obj:
    :return:
    """

    stop = Stop()

    # check if stop is already stored
    stop_val = session.scalar(select(Stop).where(Stop.train_id == train_code, Stop.station_id == stop_obj["code"]))
    if stop_val is not None:
        stop = stop_val

    # store values
    stop.train_id = train_code
    stop.station_id = stop_obj["code"]
    stop.route_id = train_code.split("_")[0]
    stop.sch_arr = to_time(stop_obj.get("schArr"), stop_obj.get("tz"))
    stop.sch_dep = to_time(stop_obj.get("schDep"), stop_obj.get("tz"))
    stop.arr = to_time(stop_obj.get("arr"), stop_obj.get("tz"))
    stop.dep = to_time(stop_obj.get("dep"), stop_obj.get("tz"))
    stop.bus = stop_obj["bus"]
    stop.platform = stop_obj["platform"]

    session.add(stop)

@scheduler.scheduled_job('interval', hours=1)
def get_data():
    print("Fetching data")

    # get data
    amtrak_data = fetch_json()

    # store the info
    store_route_info(amtrak_data)
    store_train_info(amtrak_data)

if __name__ == "__main__":
    print("Started code.")
    get_data()