import type {StopData} from "../types.ts";
import {Box, Center, Popover, Stack, Text, UnstyledButton} from "@mantine/core";
import {DateTime} from "luxon";
import {IconArrowDown} from "@tabler/icons-react";
import {useLocalStorage} from "@mantine/hooks";

export function DayView({stopOne, stopTwo, day} : {stopOne: StopData | null, stopTwo: StopData | null, day: DateTime}) {
    const trainOneTime = stopOne ? DateTime.fromISO(stopOne.arr).toLocaleString(DateTime.TIME_SIMPLE) : "No Data";
    const trainTwoTime = stopTwo ? DateTime.fromISO(stopTwo.dep).toLocaleString(DateTime.TIME_SIMPLE) : "No Data";

    const [minimumConnectionTime] = useLocalStorage({
        key: 'minimum-connection-time',
        defaultValue: 15,
    });

    let borderColor: string | null = "grey";
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
            borderColor=null;
            bgColor="green";
            textColor = "white";
        }
        else if (minimumConnectionTime > 0 && diffTimeMinutes && diffTimeMinutes <= minimumConnectionTime && diffTimeMinutes > 0) {
            borderColor=null;
            bgColor="yellow";
            textColor="black";
        }
        else {
            borderColor=null;
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
    
    const bColor = borderColor ? `1px ${borderColor} solid` : undefined

    return (
        <Popover>
            <Popover.Target>
                <Box style={{border: bColor, borderRadius: "1rem"}} bg={bgColor}>
                    <Center>
                        <UnstyledButton>
                            <Text ta={"center"} pt={"xl"} pb={"xl"} c={textColor}>{connectionText}</Text>
                        </UnstyledButton>
                    </Center>
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