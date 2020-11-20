const config = {
	hostAddress: 0xff, // if this field is left empty, would be defaault to 0xff
	LCRNodeAddress: 0x01, // LCR address device used
	port: "/dev/ttyUSB0", // COM port where device is connected
	baud: 19200, // default baud rate for LCR 600
	debug: true
};

const LCR600 = new (require(`../index`))(config, config.debug);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// succesfully parsing data, contains value
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

LCR600.on('LIST', received => {
	console.dir(received);
});

LCR600.on('TEXT', received => {
	console.dir(received);
});

LCR600.on('data', (received, data) => {
	console.log('data:', received, data);
	console.log('---------------------------------------');
});

// failed when parsing data, only contains code for debugging purpose
LCR600.on('failed', received => {
	console.error('failed:', received);
	console.log('---------------------------------------');
});

(async() => {
	const interval = config.interval || 100;

	// connect to Serialport
	await LCR600.connect();

	// get Product Id and Set synchronization
	await LCR600.getProductID(true);
	// wait to make sure communication with LCR600 is finished
	await sleep(200);

	// Set attributes data from LCR600
	await LCR600.requestAttribute('QtyUnits_WM');
	await LCR600.requestAttribute('UnitID_UL');
	await LCR600.requestAttribute('MeterID_WM');

	console.log('List set attributes:', LCR600.getAttribute());
	console.log('---------------------------------------');

	// use setTimeout instead of setInterval due to async
	const __loop = async () => {
		await LCR600.getData('GrossCount_NE');
		setTimeout(__loop, interval);
	};

	// start infinite loop
	__loop();

	// exit process for testing purpose
	setTimeout(() => {
		process.exit(0);
	}, 10000);
})();