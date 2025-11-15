import {Select, Skeleton, Stack, Center} from '@mantine/core';
import {type Dispatch, useEffect, useState} from "react";
import type {Train, TrainList} from "../types.ts";
import {IconArrowDown} from "@tabler/icons-react";


/**
 * Convert a list of trains to a list to be used by the select
 *
 * @param trainData List of all name/number combinations
 * @returns List to feed to a select
 */
function trainListToSelect(trainData: TrainList): {value: string, label: string}[] {
    const returnData: { value: string; label: string; }[] = [];
    trainData.forEach((train) => {
        returnData.push({value: train[0], label: train[0] + ' - ' + train[1]})
    })
    
    return returnData
}

/**
 * Get the route name from the route number
 *
 * @param trainData List of all number/name combinations
 * @param route Route number
 * @return Route name or empty string
 */
function nameFromRoute(trainData: TrainList, route: string): string {
    let routeName = "";

    trainData.forEach((train) => {
        console.log(route + train[0]);
        if (route === train[0]) {
            routeName = train[1];
        }
    })

    return routeName;
}

function TrainSelector({trainOne, trainTwo, changeTrainOne, changeTrainTwo}:
                       {trainOne: Train | null, trainTwo: Train | null, changeTrainOne: Dispatch<Train | null>, changeTrainTwo: Dispatch<Train | null>}) {
    const [trainData, changeTrainData] = useState<[] | TrainList>([])
    const [intersectingRoutes, changeIntersectingRoutes] = useState<[] | TrainList>([])
    const [loading, changeLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch('/api/trains')
            .then(response => response.json())
            .then(data => {changeTrainData(data); changeLoading(false);})
    }, []);

    useEffect(() => {
        if (trainOne != null) {
        fetch('/api/intersecting_routes?route_one=' + trainOne)
            .then(response => response.json())
            .then(data => {changeIntersectingRoutes(data); changeLoading(false);})
        }
    }, [trainOne]);

    return (
        <Center>
            <Stack pt={"md"} justify={"space-around"} w={"50%"}>
                <Skeleton visible={loading}>
                    <Select label="Route One" data={trainListToSelect(trainData)} value={trainOne?.route_number} onChange={(id) => {
                            changeTrainOne(id ? {route_number: id, name: nameFromRoute(trainData, id)} : null);
                            changeTrainTwo(null); changeIntersectingRoutes([]);
                    }} searchable/>
                </Skeleton>
                {trainOne != null && <><Center><IconArrowDown/></Center>
                <Skeleton visible={intersectingRoutes.length < 0}>
                    <Select label="Route Two" data={trainListToSelect(intersectingRoutes)} value={trainTwo?.route_number} onChange={(id) => {
                        changeTrainTwo(id ? {route_number: id, name: nameFromRoute(trainData, id)} : null);
                    }} searchable/>
                </Skeleton></>}
            </Stack>
        </Center>
    )
}

export default TrainSelector