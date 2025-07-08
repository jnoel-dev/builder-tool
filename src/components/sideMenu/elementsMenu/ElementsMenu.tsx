import * as React from "react";
import Divider from "@mui/material/Divider";
import AddElementButton from "@/components/sideMenu/elementsMenu/addElementButton/AddElementButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Panel from "@/components/addableElements/Panel/Panel";
import { useFrame } from "@/components/frameManager/FrameManager";

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

function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

export default function ElementsMenu() {
	

	const [selectedTab, setTab] = React.useState(0);

  const { selectedFrameName, setSelectedFrameName, frameNames} = useFrame();



	const handleTabChange = (event: React.SyntheticEvent, tabIndex: number) => {
		setTab(tabIndex);
	};



	const handleFrameChange = (event: SelectChangeEvent) => {
		setSelectedFrameName(event.target.value as string);
	};

	return (
		<div>


			<Box display="flex" width="100%" alignItems="center">

				<FormControl size="small" sx={{ flex: 1, paddingTop: "4px" }}>
					<Select
						labelId="frame-select-label"
						id="frame-select-label"
						value={selectedFrameName}
						onChange={handleFrameChange}
						sx={{
							textAlign: "center",
						}}
					>
          {frameNames.map((frame) => {
            const displayName = frame
              .replace(/([A-Z])/g, ' $1') 
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
						aria-label="basic tabs example"
						textColor="secondary"
						indicatorColor="secondary"
            centered
					>
						<Tab label="Panels" {...a11yProps(0)} />
						<Tab label="Inputs" {...a11yProps(1)} />
						<Tab label="Dialogs" {...a11yProps(2)} />
						<Tab label="Frames" {...a11yProps(3)} />
					</Tabs>
				</Box>
				<CustomTabPanel value={selectedTab} index={0}>
					<AddElementButton elementName="Panel" elementComponent={<Panel/>}/>
					<Divider component="li" />
				</CustomTabPanel>
				<CustomTabPanel value={selectedTab} index={1}>
					Item Two
				</CustomTabPanel>
				<CustomTabPanel value={selectedTab} index={2}>
					Item Three
				</CustomTabPanel>
			</Box>
		</div>
	);
}
