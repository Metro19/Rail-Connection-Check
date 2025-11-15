import '@mantine/core/styles.css';

import {Box, Divider, Group, MantineProvider, Title, UnstyledButton} from '@mantine/core';
import TrainSelector from "./trainSelector.tsx";
import {useState} from "react";
import TrainViewer from "./trainViewer.tsx";
import CornerActions from "./cornerActions.tsx";
import type {Train} from "../types.ts";

function App() {
    const [trainOne, changeTrainOne] = useState<Train | null>(null);
    const [trainTwo, changeTrainTwo] = useState<Train | null>(null);

    return (
        <MantineProvider defaultColorScheme={"dark"}>
            <Box style={{height: "100vh"}}>
                <Group justify={"space-between"} pl={"lg"} pr={"lg"} style={{top: 0}}>
                    <UnstyledButton onClick={() => {changeTrainOne(null); changeTrainTwo(null);}}><Title size={"4rem"}>Rail Connection Checker</Title></UnstyledButton>
                    <CornerActions trainOne={trainOne} trainTwo={trainTwo} changeTrainOne={changeTrainOne} changeTrainTwo={changeTrainTwo}/>
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
        </MantineProvider>
    )
}

export default App
