import {Select, Box, Skeleton, Flex} from '@mantine/core';
import {type Dispatch, useEffect, useState} from "react";
import type {TrainList} from "../types.ts";
import {IconArrowRight} from "@tabler/icons-react";

function trainListToSelect(trainData: TrainList): {value: string, label: string}[] {
    const returnData: { value: string; label: string; }[] = [];
    trainData.forEach((train) => {
        returnData.push({value: train[0], label: train[0] + ' - ' + train[1]})
    })
    
    return returnData
}

function TrainSelector({changeTrainOne, changeTrainTwo}:
                       {changeTrainOne: Dispatch<string | null>, changeTrainTwo: Dispatch<string | null>}) {
    const [trainData, changeTrainData] = useState<[] | TrainList>([])
    const [loading, changeLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch('http://localhost:8000/trains')
            .then(response => response.json())
            .then(data => {changeTrainData(data); changeLoading(false);})
    }, []);

    return (
        <Flex pt={"md"} gap={"xl"}>
            <Skeleton visible={loading}>
                <Select label="Route One" data={trainListToSelect(trainData)} onChange={(id) => {changeTrainOne(id)}} searchable/>
            </Skeleton>
            <Box pt={"xl"} style={{opacity: loading ? 0 : 100}}><IconArrowRight/></Box>
            <Skeleton visible={loading}>
                <Select label="Route Two" data={trainListToSelect(trainData)} onChange={(id) => {changeTrainTwo(id)}} searchable/>
            </Skeleton>
        </Flex>
    )
}

export default TrainSelector