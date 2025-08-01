"use client";

import React, { useRef } from "react";
import { Box, Button, Stack} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Panel from "../../panels/panel/Panel";

export default function DialogNative() {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const theme = useTheme();

	const openDialogNative = () => {
		if (dialogRef.current) {
			dialogRef.current.showModal();
		}
	};

	const closeDialogNative = () => {
		if (dialogRef.current) {
			dialogRef.current.close();
		}
	};

	return (
		<>
			<Box
				sx={{ backgroundColor: theme.palette.primary.main, padding: 2 }}
			>
				<Button
					variant="contained"
					onClick={openDialogNative}
					color="secondary"
					sx={{ color: theme.palette.text.primary }}
				>
					Open Dialog
				</Button>
			</Box>

			<dialog
				ref={dialogRef}
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					border: "none",
				}}
			>
				<Box
					sx={{
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.text.primary,
						padding: 2,
					}}
				>
          <Stack>
					<Panel />
					<Button
						variant="contained"
						onClick={closeDialogNative}
						color="secondary"
						sx={{ color: theme.palette.text.primary, }}
					>
						Close
					</Button>
          </Stack>
				</Box>
			</dialog>
		</>
	);
}
