import { ethers } from "ethers";
import React from "react";
import { useDispatch } from "react-redux";
import contractABI from '../../../../artifacts/contracts/PaintOnChain.sol/PAINT_ON_CHAIN.json';
import { Dialog, DialogContent, DialogTitle, IconButton, Typography, Grid, TextField, Button, FormControl, RadioGroup, FormControlLabel, Radio, Theme, useMediaQuery } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { Spacer } from "../../../Common/Spacer";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { setModalType } from "../../../../Redux/rootSlice";
import { useAppSelector } from "../../../../Redux/store";

interface IMetaData {
	name: string;
	description: string;
	image_data: string;
	attributes: Array<ITraits>
}

interface ITraits {
	display_type?: string;
	trait_type?: string;
	value?: string | number;
}
enum WalletTypes {
	Own = 'own',
	Friends = 'friends'
}
export const MintModal = () => {
	const dispatch = useDispatch();
	const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

	const svgContainerRef = React.useRef<HTMLDivElement | null>(null);

	const [traits, setTraits] = React.useState<Array<ITraits>>([]);
	const [name, setName] = React.useState<string>('');
	const [description, setDescription] = React.useState<string>('');
	const [numberOfTraitForms, setNumberOfTraitForms] = React.useState<number>(0);
	const [activeFormIndex, setActiveFormIndex] = React.useState<number>(0);
	const [loaded, setLoaded] = React.useState<boolean>(false);
	const [walletToMintTo, setWalletToMintTo] = React.useState<WalletTypes>(WalletTypes.Own);
	const [friendsWalletAddress, setFriendsWalletAddress] = React.useState<string>('');

	React.useEffect(() => {
		setLoaded(true);
	}, []);

	React.useEffect(() => {
		if (SVG && svgContainerRef.current) {
			const svgElement = Array.from(svgContainerRef.current.getElementsByTagName('svg'));
			const canvasElement = document.getElementById('canvas');
			if (canvasElement) {
				const width = (canvasElement.clientWidth / 2).toString();
				const height = (canvasElement.clientHeight / 2).toString();
				if (isMobile) {
					svgElement[0].style.height = height;
					svgElement[0].style.width = width;
				} else {
					svgElement[0].style.height = height;
					svgElement[0].style.width = width;
				}
			}
			svgElement[0].style.border = 'solid 4px rgb(160, 84, 129)';
			svgElement[0].style.borderRadius = '4px';
		}
	}, [loaded]);

	const { SVG, walletAddress, contractAddress } = useAppSelector(state => {
		return {
			SVG: state.rootReducer.SVG,
			walletAddress: state.rootReducer.walletAddress,
			contractAddress: state.rootReducer.contractAddress
		}
	});

	const updateTraits = () => {
		return traits.map((trait, i) => trait)
	}

	const renderForms = () => {
		return [...Array(numberOfTraitForms)].map((_, i) => {
			return (
				<Grid container spacing={1} direction={'row'} onClick={() => setActiveFormIndex(i)} sx={{ position: 'relative', marginBottom: (theme) => theme.spacing(1) }}>
					<Grid item xs={6}>
						<TextField type={'text'} variant={'outlined'}
							inputProps={{
								sx: {
									"&::placeholder": {
										color: 'white'
									}
								}
							}}
							sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '& .MuiFormLabel-root': { color: (theme) => theme.palette.primary.dark } }}
							value={traits[i] ? traits[i].trait_type : ''}
							label={'Trait Name'}
							placeholder={'Add Trait Name'}
							name={'trait_type'}
							onChange={(e) => handleChange(e, i)}
						/>
					</Grid>
					<Grid item xs={6}>
						<TextField
							type={'text'}
							variant={'outlined'}
							inputProps={{
								sx: {
									"&::placeholder": {
										color: 'white'
									}
								}
							}}
							sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '& .MuiFormLabel-root': { color: (theme) => theme.palette.primary.dark } }}
							value={traits[i] ? traits[i].value : ''}
							label={'Trait Value'}
							placeholder={'Add Trait Value'}
							name={'value'}
							onChange={(e) => handleChange(e, i)}
						/>
					</Grid>
					<IconButton onClick={() => handleRemoveTrait(i)} sx={{ position: 'absolute', right: { xs: -32, sm: -40 }, top: 16, color: 'white' }}>
						<CloseIcon />
					</IconButton>
				</Grid>
			)
		})
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
		if (traits[index]) {
			const updatedTraits = traits.map((trait, i) => {
				if (activeFormIndex === i) {
					Object.assign(trait, { [e.target.name]: e.target.value })
				}

				return trait;
			});

			setTraits(updatedTraits);
		} else {
			setTraits([...traits, { [e.target.name]: e.target.value }]);
		}
	};

	const creationDate = () => {
		return { display_type: 'date', trait_type: 'created', value: Date.now() };
	}

	const handleRemoveTrait = (index: number): void => {
		setTraits(traits.filter((_, i) => index !== i));
		setNumberOfTraitForms(numberOfTraitForms - 1);
	}

	const handleMint = async () => {

		if (!(window as any).ethereum) return;

		if (!name || !description) {
			if (!name && !description) alert('please enter a name & description for your NFT');
			else if (!name) alert('please enter a name for your NFT');
			else if (!description) alert('please enter a description for your NFT');

			return;
		}

		if (walletToMintTo === WalletTypes.Friends && friendsWalletAddress.length !== 42) {
			alert('Friends wallet address must be 42 characters in length, including the 0x prefix. Make you have not input any spaces.');
		}

		const mintAddress = walletToMintTo === WalletTypes.Own ? walletAddress : friendsWalletAddress;
		const provider = new ethers.providers.Web3Provider((window as any).ethereum);
		const signer = provider.getSigner();
		const contract = new ethers.Contract(contractAddress, contractABI.abi, signer)

		contract.mint(mintAddress, JSON.stringify(handleMetadata()));
	}

	const handleMetadata = (): IMetaData => {
		const attributes = traits.filter(t => t.trait_type && t.value);
		attributes.push(creationDate());

		return {
			name,
			description,
			image_data: SVG,
			attributes: attributes,
		}
	}

	const handleClose = () => dispatch(setModalType(undefined));


	const mintButtonStyles = {
		padding: (theme: Theme) => theme.spacing(1, 3),
		minHeight: 48,
		height: 'fit-content',
		minWidth: 140,
		width: '100%',
		color: 'black',
		border: 'solid 5px white',
		borderRadius: (theme: Theme) => theme.spacing(1),
		display: 'flex',
		flexFlow: 'column'
	}
	const radioStyles = { '& .Mui-checked': { color: 'white' }, '.MuiSvgIcon-root': { color: 'white' } }

	return (
		<>
			<Dialog
				onClose={handleClose}
				open
				PaperProps={{
					sx: {
						margin: { xs: 1, sm: 2 },
						backgroundColor: (theme) => theme.palette.primary.light,
						width: '700px',
						height: '700px',
						border: (theme) => `solid 4px ${theme.palette.primary.dark}`,
						borderRadius: 1.5
					}
				}}
			>
				<DialogTitle sx={{ backgroundColor: 'black', color: 'white' }}>
					<IconButton
						aria-label="close"
						onClick={handleClose}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							color: 'white'
						}}
					>
						<CloseIcon />
					</IconButton>
					<Typography variant={'body1'} textAlign={'center'} sx={{ margin: (theme) => theme.spacing(0, 3), fontSize: 12 }}>
						{walletToMintTo === WalletTypes.Own
							? `This token will be minted to your connected wallet: ${walletAddress.slice(0, 15)}...`
							: `This token will be minted to your friends wallet`}
					</Typography>
				</DialogTitle>
				<DialogContent dividers sx={{ backgroundColor: (theme) => theme.palette.primary.light }}>
					<Grid container justifyContent={'center'}>
						<div ref={svgContainerRef} dangerouslySetInnerHTML={{ __html: SVG }} />
						<Grid container direction={'column'} justifyContent={'center'} sx={{ width: '380px' }}>
							<Spacer vertical spacing={2} />
							<Grid container justifyContent={'center'} direction={'column'}>
								<Button onClick={handleMint} variant={'contained'} color={'secondary'} sx={mintButtonStyles}>
									<Typography variant={'body1'} sx={{ fontSize: 18, color: 'black' }}>
										Mint Your Token
									</Typography>
									<Typography variant={'body1'} sx={{ fontSize: 12, color: 'black' }}>
										(On the Ethereum blockchain!)
									</Typography>
								</Button>
							</Grid>
							<Spacer vertical spacing={1} />
							<Typography variant={'body1'} textAlign={'center'} color={'white'}>
								Add Your Metadata Below
							</Typography>
							<ArrowDownwardIcon fontSize={'large'} sx={{ margin: (theme) => theme.spacing(0, 'auto'), color: 'white' }} />
							<Spacer vertical spacing={1} />
							<TextField
								type={'text'}
								variant={'outlined'}
								inputProps={{
									sx: {
										"&::placeholder": {
											color: 'white'
										}
									}
								}}
								sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '& .MuiFormLabel-root': { color: (theme) => theme.palette.primary.dark } }}
								value={name}
								label={'Token Name'}
								placeholder={'Enter a Name For Your Token'}
								onChange={(e) => setName(e.target.value)}
							/>
							<Spacer vertical spacing={1} />
							<TextField
								type={'text'}
								variant={'outlined'}
								inputProps={{
									sx: {
										"&::placeholder": {
											color: 'white'
										}
									}
								}}
								sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '& .MuiFormLabel-root': { color: (theme) => theme.palette.primary.dark } }}
								value={description}
								label={'Token Description'}
								placeholder={'Enter A Description For Your Token'}
								onChange={(e) => setDescription(e.target.value)}
							/>
							<Spacer vertical spacing={1} />
							{renderForms()}
							<Spacer vertical spacing={1} />
							<Button variant={'contained'} onClick={() => setNumberOfTraitForms(numberOfTraitForms + 1)} sx={{ backgroundColor: (theme) => theme.palette.primary.dark }}>
								<Typography variant={'body1'} color={'white'}>
									{numberOfTraitForms === 0 ? 'Add a Trait?' : 'Add Another Trait?'}
								</Typography>
							</Button>
							<Spacer vertical spacing={2} />
							<FormControl>
								<Typography variant={'body1'} textAlign={'center'} color={'white'}>
									Where are you minting to?
								</Typography>
								<RadioGroup
									aria-labelledby="radio-wallet-group-label"
									defaultValue={WalletTypes.Own}
									name="radio-wallet-group"
									onChange={(e) => setWalletToMintTo((e.target.value as WalletTypes))}
									row
									sx={{ display: 'flex', justifyContent: 'center', color: 'white' }}
								>
									<FormControlLabel value={WalletTypes.Own} control={<Radio sx={radioStyles} />} sx={radioStyles} label={<Typography variant={"caption"}>My Currently Connected Wallet</Typography>} />
									<FormControlLabel value={WalletTypes.Friends} control={<Radio sx={radioStyles} />} sx={radioStyles} label={<Typography variant={"caption"}>A Friends Wallet</Typography>} />
								</RadioGroup>
							</FormControl>
							<Spacer vertical spacing={1} />
							{walletToMintTo === WalletTypes.Friends ?
								<>
									<TextField
										type={'text'}
										variant={'outlined'}
										inputProps={{
											sx: {
												"&::placeholder": {
													color: 'white'
												}
											}
										}}
										sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '& .MuiFormLabel-root': { color: (theme) => theme.palette.primary.dark } }}
										value={friendsWalletAddress}
										label={'Friends Wallet Address'}
										placeholder={'Enter A Friends Ethereum Wallet Address'}
										onChange={(e) => setFriendsWalletAddress(e.target.value)}
									/>
									<Spacer vertical spacing={1} />
								</>
								: null}
							<Typography textAlign={'center'} variant={'caption'} color={'white'}>
								Make sure all the above is correct! Once this is minted, it's on the blockchain like this forever!
							</Typography>
							<Spacer vertical spacing={4} />
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>
		</>
	)
}


