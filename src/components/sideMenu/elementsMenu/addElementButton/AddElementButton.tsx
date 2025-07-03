import { ComponentType } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';

interface AddElementButtonProps {
  elementName: string;
//   componentToAdd: ComponentType<any>;

}

export default function AddElementButton({  elementName }: AddElementButtonProps) {

    return(
    <ListItem>
    <Stack
    direction="row"
    width="100%"
    >
    
    <ListItemText primary={elementName}   sx={{
        display: 'flex',
        alignItems: 'center',
    }}/>
    <IconButton aria-label="add">
        <AddIcon />
    </IconButton>
    
    </Stack>
    </ListItem>
    );
}