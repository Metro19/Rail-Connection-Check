import '@mantine/core/styles.css';

import {Box, Divider, Group, MantineProvider, Title} from '@mantine/core';
import TrainSelector from "./trainSelector.tsx";
import {useState} from "react";
import TrainViewer from "./trainViewer.tsx";

function App() {
    const [trainOne, changeTrainOne] = useState<string | null>(null);
    const [trainTwo, changeTrainTwo] = useState<string | null>(null);

    return (
        <MantineProvider defaultColorScheme={"dark"}>
            <Box style={{height: "100vh"}}>
                <Group justify={"space-between"} pl={"lg"} pr={"lg"} style={{top: 0}}>
                    <Title size={"4rem"}>Rail Connection Checker</Title>
                    <TrainSelector changeTrainOne={changeTrainOne} changeTrainTwo={changeTrainTwo}/>
                </Group>
                <Box style={{alignContent: "start"}}>
                    <Divider m={"md"}/>
                    <TrainViewer trainOne={trainOne} trainTwo={trainTwo}/>
                </Box>
            </Box>
        </MantineProvider>
    )
}

export default App
