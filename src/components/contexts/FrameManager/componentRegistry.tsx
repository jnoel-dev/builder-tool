import React from "react"
import Panel from "../../addableElements/panels/panel/Panel"
import Container from "../../addableElements/frames/container/Container"
import PanelSVG from "../../addableElements/panels/panelSVG/PanelSVG"
import Input from "../../addableElements/inputs/input/Input"
import InputReact from "../../addableElements/inputs/inputReact/InputReact"
import InputComplex from "../../addableElements/inputs/inputComplex/InputComplex"
import InputRedraw from "../../addableElements/inputs/inputRedraw/InputRedraw"
import Frame from "@/components/addableElements/frames/frame/Frame"
import ShadowRoot from "@/components/addableElements/frames/shadowRoot/ShadowRoot"
import PanelCanvas from "@/components/addableElements/panels/panelCanvas/PanelCanvas"
import DialogNative from "@/components/addableElements/dialogs/dialogNative/DialogNative"
import DialogMUI from "@/components/addableElements/dialogs/dialogMUI/DialogMUI"
import DialogUI5 from "@/components/addableElements/dialogs/dialogUI5/DialogUI5"
import DialogForge from "@/components/addableElements/dialogs/dialogForge/DialogForge"
import PanelTable from "@/components/addableElements/panels/panelTable/PanelTable"
import PanelEmbedExamples from "@/components/addableElements/panels/panelEmbed/PanelEmbed"
import Fragment from "@/components/addableElements/frames/fragment/Fragment"
import NavigationButton from "@/components/sideMenu/navigationMenu/navigationButton/NavigationButton"

interface ComponentEntry {
  component: React.ComponentType<any>
  neededProps?: { [key: string]: any }
}

const componentRegistry: { [key: string]: ComponentEntry } = {
  Panel: {
    component: Panel,
  },
  PanelEmbedExamples: {
    component: PanelEmbedExamples,
  },
  PanelSVG: {
    component: PanelSVG,
  },

  PanelCanvas: {
    component: PanelCanvas,
  },
  PanelTable: {
    component: PanelTable,
  },
  PanelDisabled: {
    component: Panel,
    neededProps: { isDisabled: "true" },
  },

  Input: {
    component: Input,
  },

  InputReact: {
    component: InputReact,
  },

  InputComplex: {
    component: InputComplex,
  },

  InputRedraw: {
    component: InputRedraw,
  },
  InputPointerEvent: {
    component: Input,
    neededProps: { pointerEvent: "true" },
  },

  ContainerVertical: {
    component: Container,
    neededProps: { containerType: "vertical" },
  },

  ContainerHorizontal: {
    component: Container,
    neededProps: { containerType: "horizontal" },
  },
  FragmentVertical: {
    component: Fragment,
    neededProps: { fragmentType: "vertical" },
  },
  FragmentHorizontal: {
    component: Fragment,
    neededProps: { fragmentType: "horizontal" },
  },
  IframeSameDomain: {
    component: Frame,
    neededProps: { frameType: "sameDomain" },
  },

  IframeCrossDomain: {
    component: Frame,
    neededProps: { frameType: "crossDomain" },
  },
  PopupWindowSameDomain: {
    component: Frame,
    neededProps: { frameType: "popupSameDomain" },
  },
  PopupWindowCrossDomain: {
    component: Frame,
    neededProps: { frameType: "popupCrossDomain" },
  },
  ShadowRootOpen: {
    component: ShadowRoot,
    neededProps: { shadowRootType: "open" },
  },
  ShadowRootClosed: {
    component: ShadowRoot,
    neededProps: { shadowRootType: "closed" },
  },
  Fragment: {
    component: Fragment,
  },
  DialogNative: {
    component: DialogNative,
  },
  DialogMUI: {
    component: DialogMUI,
    neededProps: { shouldFocus: false },
  },
  DialogFocusTrap: {
    component: DialogMUI,
    neededProps: { shouldFocus: true },
  },
  DialogUI5: {
    component: DialogUI5,
  },
  DialogForge: {
    component: DialogForge,
  },
  NavigationButton: {
    component: NavigationButton,
  },
}

export default componentRegistry
