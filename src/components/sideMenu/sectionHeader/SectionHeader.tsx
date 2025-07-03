
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';

interface SectionHeaderProps {
  sectionName: string;

}

export default function SectionHeader({ sectionName }: SectionHeaderProps) {

    return(
        <div>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${sectionName}-content`}
          id={`panel-${sectionName}-header`}
        >
          <Typography component="span" sx={{ width: '100%', textAlign: 'center' }}>
            {sectionName}
          </Typography>
        </AccordionSummary>
        </div>
    );
}