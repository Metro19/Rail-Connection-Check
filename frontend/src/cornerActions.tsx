import {Button, Group, Stack} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";

export default function CornerActions() {
    return (<Group>
        <Stack pl={"xs"} pt={"xs"} gap={"xs"}>
            <Button leftSection={<IconInfoCircle/>}>Information</Button>
        </Stack>
    </Group>)
}