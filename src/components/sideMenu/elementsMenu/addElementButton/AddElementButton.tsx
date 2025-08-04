import { ReactNode } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import { useFrame } from '@/components/contexts/FrameManager/FrameManager';

interface AddElementButtonProps {
  elementName: string;
  isFrameOrContainer?: boolean;
}

export default function AddElementButton({ elementName, isFrameOrContainer=false}: AddElementButtonProps) {
  const { addElementToCurrentFrame} = useFrame();


const handleAdd = () => {

  addElementToCurrentFrame(elementName,isFrameOrContainer);

};


  return (
    <ListItem>
      <Stack direction="row" width="100%">
        <ListItemText
          primary={elementName}
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        />
        <IconButton onClick={handleAdd}>
          <AddIcon />
        </IconButton>
      </Stack>
    </ListItem>
  );
}
