import * as React from "react";
import Divider from "@mui/material/Divider";
import AddElementButton from "@/components/sideMenu/elementsMenu/addElementButton/AddElementButton";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

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
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function ElementsMenu() {

  const [alignment, setAlignment] = React.useState<string | null>('vertical');

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleAlignment = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string | null,
  ) => {
    setAlignment(newAlignment);
  };
  return (
    <div>
<ToggleButtonGroup
  value={alignment}
  exclusive
  onChange={handleAlignment}
  aria-label="Platform"
  sx={{ width: '100%'}} 
>
  <ToggleButton value="vertical" fullWidth sx={{ padding: '9px'}} >
    Add Vertically
  </ToggleButton>
  <ToggleButton value="horizontal" fullWidth sx={{ padding: '9px'}} >
    Add Horizontally
  </ToggleButton>
</ToggleButtonGroup>

    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" textColor="secondary"
  indicatorColor="secondary">
          <Tab label="Item One" {...a11yProps(0)} />
          <Tab label="Item Two" {...a11yProps(1)} />
          <Tab label="Item Three" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
             
        <AddElementButton elementName="Panel" />
         <Divider component="li" />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        Item Two
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        Item Three
      </CustomTabPanel>
    </Box>




    </div>
    
  );
}
