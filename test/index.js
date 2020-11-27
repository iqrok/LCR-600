const config = {
	hostAddress: 0xff, // if this field is left empty, would be default to 0xff
	LCRNodeAddress: 0x01, // LCR address device used
	port: "/dev/ttyUSB0", // COM port where device is connected
	baud: 19200, // default baud rate for LCR 600
	debug: true,
	interval: 100,
};

const lcr600 = require(`../`);
const LCR600 = new lcr600(config, config.debug);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// listener for each summary
LCR600.on('GrossCount_NE', received => {
	const data = {
			...received,
			attributes: {
				unitId: LCR600.getAttribute('UnitID_UL'),
				meterId: LCR600.getAttribute('MeterID_WM'),
				qtyUnit: LCR600.getAttribute('QtyUnits_WM'),
			},
		};

	console.dir(data, {depth:4});
	console.log('---------------------------------------');
});

// successfully parsing data
LCR600.on('data', (received) => {
	console.log('data:');
	console.log(received);
	console.log('---------------------------------------');
});

// failed when parsing data, only contains code for debugging purpose
LCR600.on('failed', received => {
	console.error('failed:', received);
	console.log('---------------------------------------');
});

// Listener when port is opened
LCR600.on('open', received => {
	console.log('open:', received);
	console.log('---------------------------------------');
});

// Listener when port is closed
LCR600.on('close', received => {
	console.log('close:', received);
	console.log('---------------------------------------');
});

// Listener when port is error
LCR600.on('error', received => {
	console.error('error:', received);
	console.log('---------------------------------------');
});

// failed when parsing data, only contains code for debugging purpose
LCR600.on('switch', received => {
	console.error('switch change:', received);

	if(received.from.code === 0x01 && received.to.code === 0x02){
		LCR600.interruptSummary('GrossCount_NE');
	}

	console.log('---------------------------------------');
});

(async() => {
	const interval = config.interval || 100;

	// connect to Serialport
	await LCR600.connect();

	// get Product Id and Set synchronization
	await LCR600.getProductID(true);
	// Set attributes data from LCR600
	await LCR600.requestAttribute('QtyUnits_WM');
	await LCR600.requestAttribute('UnitID_UL');
	await LCR600.requestAttribute('MeterID_WM');

	console.log('List set attributes:', LCR600.getAttribute());
	console.log('---------------------------------------');

	// set waiting for flow to be steady to 10 seconds
	LCR600.setWaitingTime(10000);

	await LCR600.getDeviceStatus();
	await LCR600.getData('GrossCount_NE');

	// use setTimeout instead of setInterval due to async
	const __loop = async () => {
		await LCR600.getData('GrossCount_NE');
		setTimeout(__loop, interval);
	};

	// start infinite loop
	__loop();

	// exit process for testing purpose
	setTimeout(() => {
			console.log('Finished');
			process.exit(0);
		}, 10000);
})();
