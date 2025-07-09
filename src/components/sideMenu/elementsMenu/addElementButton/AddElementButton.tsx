import { ReactNode } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import { useFrame } from '@/components/frameManager/FrameManager';

interface AddElementButtonProps {
  elementName: string;
  elementComponent: ReactNode;
}

export default function AddElementButton({ elementName, elementComponent }: AddElementButtonProps) {
  const { addElementToFrame} = useFrame();


const handleAdd = () => {

  addElementToFrame(elementName, elementComponent);
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
        <IconButton aria-label="add" onClick={handleAdd}>
          <AddIcon />
        </IconButton>
      </Stack>
    </ListItem>
  );
}
