from datetime import datetime

from sqlalchemy import ForeignKey, Engine, create_engine, nullsfirst, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, relationship, Session
from sqlalchemy.testing.schema import mapped_column


class Base(DeclarativeBase):
    pass

class Route(Base):
    __tablename__ = "route"

    num: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()

class Station(Base):
    __tablename__ = "station"

    stop_code: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    timezone: Mapped[str] = mapped_column()

class RouteStop(Base):
    __tablename__ = "route_stop"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    route_id: Mapped[str] = mapped_column(ForeignKey("route.num"))
    station_code: Mapped[str] = mapped_column(ForeignKey("station.stop_code"))

    route: Mapped[Route] = relationship("Route")
    station: Mapped[Station] = relationship("Station")

class Train(Base):
    __tablename__ = "train"

    train_id: Mapped[str] = mapped_column(primary_key=True)

    route_id: Mapped[str] = mapped_column(ForeignKey("route.num"))
    route: Mapped[Route] = relationship("Route")

class Stop(Base):
    __tablename__ = "stop"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    sch_arr: Mapped[datetime] = mapped_column()
    sch_dep: Mapped[datetime] = mapped_column()
    arr: Mapped[datetime] = mapped_column(nullable=True)
    dep: Mapped[datetime] = mapped_column(nullable=True)
    bus: Mapped[bool] = mapped_column()
    platform: Mapped[str] = mapped_column(nullable=True)

    station_id: Mapped[str] = mapped_column(ForeignKey("station.stop_code"))
    train_id: Mapped[str] = mapped_column(ForeignKey("train.train_id"))
    route_id: Mapped[str] = mapped_column(ForeignKey("route.num"))

    station: Mapped[Station] = relationship("Station")
    train: Mapped[Train] = relationship("Train")
    route: Mapped[Route] = relationship("Route")

    def __repr__(self):
        return f"STOP: {self.station_id} {self.train_id} ({self.route_id})"

    def to_json(self):
        return {
            "station_id": self.station_id,
            "train_id": self.train_id,
            "route_id": self.route_id,
            "sch_arr": self.sch_arr.isoformat(),
            "sch_dep": self.sch_dep.isoformat(),
            "arr": self.arr.isoformat() if self.arr else None,
            "dep": self.dep.isoformat() if self.dep else None,
            "bus": self.bus,
            "platform": self.platform
        }


# Base.metadata.create_all(engine)
#
# with Session(engine) as session:
#     new_route = Route(num=1, name="Test Limited")
#     new_station = Station(stop_code="ABC", name="Alphabet")
#     new_route_stop = RouteStop(route_id=new_route.num, station_code=new_station.stop_code)
#
#     session.add_all([new_route_stop, new_route, new_station])
#     session.commit()