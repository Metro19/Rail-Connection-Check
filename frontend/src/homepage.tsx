import {useState} from "react";
import type {Train} from "../types.ts";
import {useViewportSize} from "@mantine/hooks";
import {Affix, Box, Divider, Group, Stack, Text, Title, UnstyledButton} from "@mantine/core";
import CornerActions from "./cornerActions.tsx";
import TrainViewer from "./trainViewer.tsx";
import TrainSelector from "./trainSelector.tsx";
import MobileTrainViewer from "./mobileTrainViewer.tsx";

export default function Homepage() {
    const [trainOne, changeTrainOne] = useState<Train | null>(null);
    const [trainTwo, changeTrainTwo] = useState<Train | null>(null);
    const {width} = useViewportSize();

    // desktop
    if (width > 1000) {
        return (
            <Box style={{height: "100vh"}}>
                <Group justify={"space-between"} pl={"lg"} pr={"lg"} style={{top: 0}}>
                    <UnstyledButton onClick={() => {changeTrainOne(null); changeTrainTwo(null);}}><Title size={"4rem"}>Rail Connection Checker</Title></UnstyledButton>
                    <CornerActions/>
                </Group>
                <Box style={{alignContent: "start"}}>
                    <Divider m={"md"}/>
                    {(trainOne && trainTwo) ?
                        <TrainViewer trainOne={trainOne} trainTwo={trainTwo} changeTrainOne={changeTrainOne} changeTrainTwo={changeTrainTwo}/>
                        :
                        <TrainSelector trainOne={trainOne} trainTwo={trainTwo} changeTrainOne={changeTrainOne} changeTrainTwo={changeTrainTwo}/>
                    }
                </Box>
            </Box>
        )
    }

    // mobile
    else {
        return (
            <>
                <Affix position={{ bottom: 20, right: 20 }}>
                    <CornerActions/>
                </Affix>
                <Stack>
                    <Text mt={"xs"} ta={"center"} size={"2rem"}>Rail Connection Checker</Text>
                    <Divider m={0}/>
                    {(trainOne && trainTwo) ?
                    <MobileTrainViewer trainOne={trainOne} trainTwo={trainTwo} changeTrainOne={changeTrainOne} changeTrainTwo={changeTrainTwo}/>
                    :
                    <TrainSelector trainOne={trainOne} trainTwo={trainTwo} changeTrainOne={changeTrainOne} changeTrainTwo={changeTrainTwo}/>
                    }
                </Stack>
            </>
        )
    }
}