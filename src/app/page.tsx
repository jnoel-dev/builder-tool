import SideMenu from '@/components/sideMenu/SideMenu';
import TopFrame from '@/components/topFrame/TopFrame';


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
      <TopFrame/>
      <SideMenu/>

    </div>
  
  );
}
