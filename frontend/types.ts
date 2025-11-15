export type TrainList = [string, string][];

export interface StopData {
    station_id: string,
    train_id: string,
    route_id: string,
    sch_arr: string,
    sch_dep: string,
    arr: string,
    dep: string,
    bus: string,
    platform: string
}

export interface Train {
    route_number: string,
    name: string
}

export interface TrainCompare {
    route_one_num: string,
    route_one_name: string,
    route_one: StopData[],
    route_two_num: string,
    route_two_name: string,
    route_two: StopData[],
    station: string,
    station_name: string
}