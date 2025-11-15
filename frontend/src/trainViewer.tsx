import {ActionIcon, Center, Group, SimpleGrid, Space, Stack, Text} from '@mantine/core';
import {IconAlertTriangle, IconArrowBackUp, IconArrowRight, IconMapRoute, IconTrack} from "@tabler/icons-react";
import {type Dispatch, useEffect, useState} from "react";
import type {Train, TrainCompare} from "../types.ts";
import {DateTime} from "luxon";
import {DayView} from "./dayView.tsx";

function TrainViewer({trainOne, trainTwo, changeTrainOne, changeTrainTwo} : {trainOne: Train | null, trainTwo: Train | null, changeTrainOne: Dispatch<Train | null>, changeTrainTwo: Dispatch<Train | null>}) {
    const [connData, changeConnData] = useState<TrainCompare | null>(null);
    const [error, changeError] = useState<string | null>("Test Error");
    
    useEffect(() => {
        fetch(`/api/compare_trains?route_one=${trainOne?.route_number}&route_two=${trainTwo?.route_number}`)
            .then(response => {
                if (response.status === 400) {
                    return response.json().then(msg => {
                        changeError(msg["detail"] || "Bad Request");
                        changeConnData(null);
                        return null;
                    });
                }
                else {
                    return response.json()
                }
            })
            .then(data => {changeConnData(data); changeError(null);})
            .catch(() => {
                changeError("Network Error");
                changeConnData(null);
            })
    }, [trainOne, trainTwo]);

    //  check for no trains selected
    if (trainOne === null || trainTwo === null) {
        return (
            <Center h={"75vh"}>
                <Stack align={"center"}>
                    <IconTrack size={"4rem"}/>
                    <Text size={"lg"}>Select Routes</Text>
                </Stack>
            </Center>
        )
    }

    // check for error
    else if (error != null) {
        return (
            <Center h={"75vh"}>
                <Stack align={"center"} bg={"red"} p={"5rem"} style={{borderRadius: "1rem"}}>
                    <IconAlertTriangle size={"4rem"} color={"black"}/>
                    <Text size={"lg"} c={"black"}>{error}</Text>
                </Stack>
            </Center>
        )
    }

    // check for loading
    else if (connData === null) {
        return (
            <Center h={"75vh"}>
                <Stack align={"center"}>
                    <IconMapRoute size={"4rem"}/>
                    <Text size={"lg"}>Now Loading</Text>
                </Stack>
            </Center>
        )
    }

    // display train data
    else {
        // create grid list
        const objs = [];
        for (let i = 0; i < connData.route_one.length; i++) {
            objs.push(<DayView stopOne={connData.route_one[i]} stopTwo={connData.route_two[i]} day={DateTime.now().minus({day: i})}/>);
        }

        return (
            <Center>
                <Stack>
                    <Center>
                        <Group>
                            <Text size={"2rem"}>{connData.route_one_num + " - " + connData.route_one_name}</Text>
                            <IconArrowRight/>
                            <Text size={"2rem"}>{connData.route_two_num + " - " + connData.route_two_name}</Text>
                            <ActionIcon bg={"red"}>
                                <IconArrowBackUp onClick={() => {changeTrainOne(null); changeTrainTwo(null)}} aria-label={"Reset search"}/>
                            </ActionIcon>
                        </Group>
                    </Center>
                    <Text size={"2rem"}>Connections at {connData.station_name} from {DateTime.now().minus({days: 30}).toLocaleString(DateTime.DATE_MED)} to {DateTime.now().toLocaleString(DateTime.DATE_MED)}</Text>
                    <Space h={"xl"}/>
                    <SimpleGrid cols={7}>
                        {objs.map((obj) => (
                            <div>
                                {obj}
                            </div>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Center>
        )
    }
}

export default TrainViewer