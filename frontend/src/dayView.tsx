import type {StopData} from "../types.ts";
import {Box, Center, Popover, Stack, Text} from "@mantine/core";
import {DateTime} from "luxon";
import {IconArrowDown} from "@tabler/icons-react";

export function DayView({stopOne, stopTwo, day} : {stopOne: StopData | null, stopTwo: StopData | null, day: DateTime}) {
    const trainOneTime = stopOne ? DateTime.fromISO(stopOne.arr).toLocaleString(DateTime.TIME_SIMPLE) : "No Data";
    const trainTwoTime = stopTwo ? DateTime.fromISO(stopTwo.dep).toLocaleString(DateTime.TIME_SIMPLE) : "No Data";

    let borderColor: string | null = "grey";
    let bgColor = undefined;
    let connectionText = "No Data"

    if (stopOne && stopTwo) {
        const t1 = DateTime.fromISO(stopOne.arr);
        const t2 = DateTime.fromISO(stopTwo.dep);

        const diffTime = t2.diff(t1, ['hours', 'minutes']).toObject();
        const diffTimeMinutes = t2.diff(t1, 'minutes').toObject().minutes;

        console.log(diffTime["minutes"]);

        if (diffTimeMinutes && diffTimeMinutes >= 15) {
            borderColor=null;
            bgColor="green";
        }

        connectionText = `${diffTime.hours && diffTime.hours + 'h'} ${diffTime.minutes +'m'}`;
    }

    return (
        <Popover>
            <Popover.Target>
                <Box style={{border: borderColor && `1px ${borderColor} solid`, borderRadius: "1rem"}} bg={bgColor}>
                    <Text ta={"center"} pt={"xl"} pb={"xl"}>{connectionText}</Text>
                </Box>
            </Popover.Target>
            <Popover.Dropdown>
                <Stack gap={0}>
                    <Text ta={"center"}>{day.toLocaleString(DateTime.DATE_MED)}</Text>
                    <Text ta={"center"}>{trainOneTime} {stopOne?.platform && 'Platform ' + stopOne.platform}</Text>
                    <Center><IconArrowDown/></Center>
                    <Text ta={"center"}>{trainTwoTime} {stopTwo?.platform && 'Platform ' + stopTwo.platform}</Text>
                </Stack>
            </Popover.Dropdown>
        </Popover>

    )
}