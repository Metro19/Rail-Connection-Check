from typing import List

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from db import Route, Base, RouteStop, Station
from fetch_amtrak_json import fetch_json

engine = create_engine("")
Base.metadata.create_all(engine)
amtrak_data = fetch_json()

def generate_start_train_code(starting_code: str) -> str:
    return ""

def store_route_info(data: dict):
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
            all_routes.append(route)
            new_objects += store_station_info(data[route][0], all_stations)

    # save all new objects
    with Session(engine) as session:
        session.add_all(new_objects)
        session.commit()

def store_station_info(data: dict, all_station_codes: List[str]) -> list:
    new_objects: list = [Route(num=data["trainNum"], name=data["routeName"])]

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
    pass

# store_route_info(amtrak_data)
