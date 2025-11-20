import {ActionIcon, Box, Group, Modal, NumberInput, Stack, Text} from "@mantine/core";
import {IconSettings} from "@tabler/icons-react";
import {useState} from "react";
import {useLocalStorage} from "@mantine/hooks";

export default function CornerActions() {
    const [modal, changeModal] = useState<boolean>(false);
    const [minimumConnectionTime, changeMinimumConnectionTime] = useLocalStorage({
        key: 'minimum-connection-time',
        defaultValue: 15,
    });

    return (
        <>
            <ActionIcon aria-label={"Settings"} onClick={() => changeModal(true)}>
                <IconSettings/>
            </ActionIcon>
            <Modal opened={modal} onClose={() => changeModal(false)} title={"Settings"}>
                <Stack>
                    <Stack gap={0}>
                        <h3 style={{margin: 0}}>Connection Timings</h3>
                        <h5 style={{margin: 0}}>Minutes between departure per color:</h5>
                    </Stack>
                    <Group grow gap={"xs"}>
                        <Box bg={"green"}>
                            <Text c={"white"} ta={"center"}>Good</Text>
                            <Text c={"white"} ta={"center"}>{minimumConnectionTime + 1}+</Text>
                        </Box>
                        {(minimumConnectionTime > 0) && <Box bg={"yellow"}>
                            <Text c={"black"} ta={"center"}>Tight</Text>
                            <Text c={"black"} ta={"center"}>{minimumConnectionTime} to 0</Text>
                        </Box>}
                        <Box bg={"red"}>
                            <Text c={"white"} ta={"center"}>Missed</Text>
                            <Text c={"white"} ta={"center"}>0 or fewer</Text>
                        </Box>
                    </Group>
                    <NumberInput label={"Tight Connection Time"}
                                 description={"How close to departure do you consider the connection to be tight?"}
                                 defaultValue={15}
                                 value={minimumConnectionTime}
                                 allowNegative={false}
                                 allowDecimal={false}
                                 onChange={(value) => changeMinimumConnectionTime(value ? Number(value) : 0)}
                    />
                </Stack>
            </Modal>
        </>
    )
}