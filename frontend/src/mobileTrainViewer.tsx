import {type Dispatch, useEffect, useState} from "react";
import type {StopData, Train, TrainCompare} from "../types.ts";
import {Accordion, ActionIcon, Box, Button, Center, Divider, Group, SimpleGrid, Stack, Text} from "@mantine/core";
import {
    IconAlertTriangle,
    IconArrowBackUp,
    IconArrowDown,
    IconArrowRight, IconBackspaceFilled,
    IconMapRoute
} from "@tabler/icons-react";
import {DateTime} from "luxon";
import {useLocalStorage} from "@mantine/hooks";

function IndividualAccordion({stopOne, stopTwo, day}: {stopOne: StopData, stopTwo: StopData, day: DateTime<true>}) {
    const [minimumConnectionTime] = useLocalStorage({
        key: 'minimum-connection-time',
        defaultValue: 15,
    });

    let bgColor = undefined;
    let connectionText = "No Data"
    let textColor = undefined;

    if (stopOne && stopTwo) {
        const t1 = DateTime.fromISO(stopOne.arr);
        const t2 = DateTime.fromISO(stopTwo.dep);

        const diffTime = t2.diff(t1, ['hours', 'minutes']).toObject();
        const diffTimeMinutes = t2.diff(t1, 'minutes').toObject().minutes;

        // check colors
        if (diffTimeMinutes && diffTimeMinutes > minimumConnectionTime) {
            bgColor="green";
            textColor = "white";
        }
        else if (minimumConnectionTime > 0 && diffTimeMinutes && diffTimeMinutes <= minimumConnectionTime && diffTimeMinutes > 0) {
            bgColor="yellow";
            textColor="black";
        }
        else {
            bgColor="red";
            textColor="white";
        }

        if (diffTimeMinutes && diffTimeMinutes >= 60) {
            connectionText = `${(diffTime.hours) && diffTime.hours + 'h'} ${diffTime.minutes}m`;
        }
        else {
            connectionText = `${diffTime.minutes}m`
        }
    }

    return (
        <Accordion.Item key={day.toMillis()} value={day.toISO()}>
            <Accordion.Control bg={bgColor}>
                <Group justify={"space-between"}>
                    <Text c={textColor}>{day.month}/{day.day}</Text>
                    <Text c={textColor} pr={"xs"}>{connectionText}</Text>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <Stack gap={0}>
                    {stopOne ?
                        <Group justify={"center"}>
                            <Text size={"1.5rem"}>{DateTime.fromISO(stopOne.arr).toLocaleString(DateTime.TIME_SIMPLE)}</Text>
                            <Group>
                                <Text size={"1.5rem"}>Platform: {stopOne.platform || "-"}</Text>
                            </Group>
                        </Group>
                    :
                    <Text ta={"center"} fs={"italic"} size={"1.5rem"}>No Data</Text>}
                    <Center p={"xs"}><IconArrowDown/></Center>
                    {stopTwo ?
                        <Group justify={"center"}>
                            <Text size={"1.5rem"}>{DateTime.fromISO(stopTwo.arr).toLocaleString(DateTime.TIME_SIMPLE)}</Text>
                            <Group>
                                <Text size={"1.5rem"}>Platform: {stopTwo.platform || "-"}</Text>
                            </Group>
                        </Group>
                        :
                        <Text ta={"center"} fs={"italic"} size={"1.5rem"}>No Data</Text>}
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    )
}

function StatsView({trains}: {trains: TrainCompare}) {
    const [minimumConnectionTime] = useLocalStorage({
        key: 'minimum-connection-time',
        defaultValue: 15,
    });

    // stats
    let good = 0;
    let tight = 0;
    let missed= 0;
    let no_data = 0;
    let sum = 0;

    for (let i = 0; i < trains.route_one.length; i++) {
        const stopOne = trains.route_one[i];
        const stopTwo = trains.route_two[i];

        if (!stopOne || !stopTwo) {
            no_data++;
        }
        else {
            const stopOneTime = DateTime.fromISO(stopOne.arr)
            const stopTwoTime = DateTime.fromISO(stopTwo.dep)
            const diff = stopTwoTime.diff(stopOneTime, ['minutes']).minutes
            sum += diff;

            if (diff <= 0) {
                missed++;
            }
            else if (minimumConnectionTime > 0 && minimumConnectionTime >= diff) {
                tight++;
            }
            else {
                good++;
            }
        }


    }

    // calculate get connection time avg color
    let avgColor = "green";
    let avg = sum / (good + tight + missed);
    if (avg <= 0) {
        avgColor = "red";
    }
    else if (avg < minimumConnectionTime) {
        avgColor = "yellow";
    }

    // calculate the average delay
    let neg = false;
    if (sum < 0) {
        avg = avg * -1;
        neg = true;
    }

    return (<Stack gap={0}>
        <SimpleGrid cols={2} m={"xs"} style={{outline: "1px grey solid", borderRadius: "1rem"}}>
            <Box>
                <Text ta={"center"} size={"4rem"} c={"green"}>{good}</Text>
                <Text ta={"center"}>Good</Text>
            </Box>
            <Box>
                <Text ta={"center"} size={"4rem"} c={"yellow"}>{tight}</Text>
                <Text ta={"center"}>Tight</Text>
            </Box>
            <Box>
                <Text ta={"center"} size={"4rem"} c={"red"}>{missed}</Text>
                <Text ta={"center"}>Missed</Text>
            </Box>
            <Box>
                <Text ta={"center"} size={"4rem"}>{no_data}</Text>
                <Text ta={"center"}>No Data</Text>
            </Box>
        </SimpleGrid>
        <Box m={"xs"} style={{outline: "1px grey solid", borderRadius: "1rem"}}>
            <Text pt={".5rem"} ta={"center"} size={"1rem"}>Average Connection Time:</Text>
            <Text ta={"center"} size={"3rem"} c={avgColor}>{neg && "-"}{Math.floor(avg/60)}:{Math.round(avg%60)}</Text>
        </Box>
    </Stack>)
}

export default function MobileTrainViewer({trainOne, trainTwo, changeTrainOne, changeTrainTwo} : {trainOne: Train | null, trainTwo: Train | null, changeTrainOne: Dispatch<Train | null>, changeTrainTwo: Dispatch<Train | null>}) {
    const [connData, changeConnData] = useState<TrainCompare | null>(null);
    const [error, changeError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/compare_trains?route_one=${trainOne?.route_number}&route_two=${trainTwo?.route_number}`)
            .then(response => {
                // return response.json()
                if (response.status === 400) {
                    return response.json().then(msg => {
                        changeError(msg["detail"] || "Bad Request");
                        changeConnData(null);
                        return null;
                    });
                }
                else {
                    return response.json().then(data => {changeConnData(data); changeError(null);})
                }
            })
    }, [trainOne, trainTwo]);

    // check for error
    if (error != null) {
        return (
            <Center h={"75vh"}>
                <Stack gap={0}>
                    <Stack m={"xs"} align={"center"} bg={"red"} p={"5rem"} style={{borderRadius: "1rem"}}>
                        <IconAlertTriangle size={"4rem"} color={"black"}/>
                        <Text size={"md"} c={"black"}>{error}</Text>
                    </Stack>
                    <Button bg={"red"} m={"xs"} c={"black"} leftSection={<IconBackspaceFilled/>}
                            onClick={() => {changeTrainOne(null); changeTrainTwo(null); changeError(null);}}
                    >
                        Restart
                    </Button>
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
            objs.push(<IndividualAccordion stopOne={connData.route_one[i]} stopTwo={connData.route_two[i]} day={DateTime.now().minus({day: i})}/>);
        }

        return (
            <Center>
                <Stack w={"100%"}>
                    <Center>
                        <Group>
                            <Text size={"2rem"}>{connData.route_one_num}</Text>
                            <IconArrowRight/>
                            <Text size={"2rem"}>{connData.route_two_num}</Text>
                            <ActionIcon bg={"red"}>
                                <IconArrowBackUp onClick={() => {changeTrainOne(null); changeTrainTwo(null)}} aria-label={"Reset search"}/>
                            </ActionIcon>
                        </Group>
                    </Center>
                    <Text ta={"center"} size={"2rem"}>{connData.station_name}</Text>
                    <Divider/>
                    <Text ta={"center"} size={"1.5rem"}>The Last {connData.route_one.length} Days of Connections:</Text>
                    <StatsView trains={connData}/>
                    <Accordion>
                        {objs}
                    </Accordion>
                </Stack>
            </Center>
        )
    }
}