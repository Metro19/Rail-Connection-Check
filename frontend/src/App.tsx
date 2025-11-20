import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';

import {MantineProvider} from '@mantine/core';
import Homepage from "./homepage.tsx";

function App() {
    return (
        <MantineProvider defaultColorScheme={"dark"}>
            <Homepage/>
        </MantineProvider>
    )
}

export default App
