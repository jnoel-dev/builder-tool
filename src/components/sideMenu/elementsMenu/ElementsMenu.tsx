"use client";

import * as React from "react";
import Divider from "@mui/material/Divider";
import AddElementButton from "@/components/sideMenu/elementsMenu/addElementButton/AddElementButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { FormHelperText } from "@mui/material";

enum TabIndex {
	Frames,
	Panels,
	Inputs,
	Dialogs,
}

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function CustomTabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && <Box>{children}</Box>}
		</div>
	);
}

function getTabProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

export default function ElementsMenu() {
	const [selectedTab, setTab] = React.useState(TabIndex.Frames);
	const { currentFrame, setCurrentFrame, frameList } = useFrame();

	const handleTabChange = (event: React.SyntheticEvent, tabIndex: number) => {
		setTab(tabIndex);
	};

	const handleFrameChange = (event: SelectChangeEvent) => {

		setCurrentFrame(event.target.value as string);
	};

	return (
		<div>
			<Box display="flex" width="100%" alignItems="center">
				<FormControl size="small" sx={{ flex: 1, paddingTop: "4px" }}>
					<FormHelperText sx={{ margin:0}}>Select a frame</FormHelperText>
					<Select
						labelId="frame-select-label"
						id="frame-select-label"
						value={currentFrame}
						onChange={handleFrameChange}
						sx={{ textAlign: "center" }}
					>
						{frameList.map((frame) => {
							const displayName = frame
								.replace(/([A-Z])/g, " $1")
								.trim()
								.toUpperCase();

							return (
								<MenuItem key={frame} value={frame}>
									{displayName}
								</MenuItem>
							);
						})}
					</Select>
				</FormControl>
			</Box>

			<Box sx={{ width: "100%" }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs
						value={selectedTab}
						onChange={handleTabChange}
						aria-label="element tabs"
						textColor="secondary"
						indicatorColor="secondary"
						centered
					>
						<Tab label="Frames" {...getTabProps(TabIndex.Frames)} />
						<Tab label="Panels" {...getTabProps(TabIndex.Panels)} />
						<Tab label="Inputs" {...getTabProps(TabIndex.Inputs)} />
						<Tab label="Dialogs" {...getTabProps(TabIndex.Dialogs)} />
						
					</Tabs>
				</Box>

				{/* //ELEMENT NAME MUST MATCH WHAT IS DEFINED IN COMPONENT REGISTRY - strings are used here cause we add elements to frame in the same way we deserialize from URL*/}
				<CustomTabPanel value={selectedTab} index={TabIndex.Panels}>
					<AddElementButton elementName="Panel" />
					<Divider component="li" />
					<AddElementButton elementName="PanelSVG" />
					<Divider component="li" />
					<AddElementButton elementName="PanelCanvas" />
					<Divider component="li" />
				</CustomTabPanel>

				<CustomTabPanel value={selectedTab} index={TabIndex.Inputs}>
					<AddElementButton elementName="Input" />
					<Divider component="li" />
					<AddElementButton elementName="InputReact" />
					<Divider component="li" />
					<AddElementButton elementName="InputComplex" />
					<Divider component="li" />
					<AddElementButton elementName="InputRedraw" />
					<Divider component="li" />
				</CustomTabPanel>

				<CustomTabPanel value={selectedTab} index={TabIndex.Dialogs}>
					<AddElementButton elementName="DialogNative" />
					<Divider component="li" />
				</CustomTabPanel>

				<CustomTabPanel value={selectedTab} index={TabIndex.Frames}>
					<AddElementButton
						elementName="IframeSameDomain"
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton
						elementName="IframeCrossDomain"
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton
						elementName="ContainerVertical"
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton
						elementName="ContainerHorizontal"
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton
						elementName="ShadowRootOpen"
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton
						elementName="ShadowRootClosed"
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
				</CustomTabPanel>
			</Box>
		</div>
	);
}
