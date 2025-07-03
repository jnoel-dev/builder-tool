
import SideMenu from '@/components/sideMenu/SideMenu';
import FrameBase from '@/components/frameBase/FrameBase';


export default function Home() {

  
  return (
  <div
    style={{
      width: "100%",
      height: "100%",
      position: "fixed",
      top: 0,
      right: 0,
      overflowY: "auto",

      display: "flex",
      justifyContent: "center", 
      alignItems: "center",    
    }}
  >
      <FrameBase frameName="TopFrame"/>
      <SideMenu/>
    </div>
    
  );
}
