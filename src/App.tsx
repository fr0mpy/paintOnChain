
import * as React from 'react';

import ThemeProvider from "@mui/material/styles/ThemeProvider";
import { theme } from './Theme'
import { LayoutResolver } from "./Components/Layout/LayoutResolver";
import { ModalResolver, ModalType } from './Components/Layout/ModalResolver';
import { useDispatch } from 'react-redux';
import { setModalType } from './Redux/rootSlice';
import { CustomSnackbar } from './Components/CustomSnackbar';

function App() {
	const canvasRef = React.useRef<fabric.Canvas | null>(null);

	const dispatch = useDispatch();

	const renderWelcomeModal = () => {
		setTimeout(() => {
			dispatch(setModalType(ModalType.Welcome))
		}, 1500)
	}

	React.useEffect(() => {
		const welcomeModalDismissed = localStorage.getItem('welcomeModalDismissed');

		if (!welcomeModalDismissed) {
			renderWelcomeModal();
		}
	});

	return (
		<>
			<ThemeProvider theme={theme}>
				<CustomSnackbar />
				<LayoutResolver canvasRef={canvasRef} />
				<ModalResolver canvasRef={canvasRef} />
			</ThemeProvider>
		</>
	);
}

export default App;
