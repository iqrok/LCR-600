# [LectroCount® LCR®600](https://www.lcmeter.com/products/registration-software/electronic-registration/lectrocount-lcr-600)

You should connect to LCR600 with RS-232. Won't work with Serial TTL Voltage level

List of event names:
- __data__
	emitted when received data from LCR 600 is succesfully parsed
- __failed__
	emitted when received data from LCR 600 cant be parsed, only contains LCR return code to troubleshoot
- __switch__
	emitted when LCR 600 switch position is changed
- __field name__
	emitted when value from number data type is changed. example of field names: _GrossQty_NE_, _NetQty_NE_, etc

## Installation
```bash
npm install lcr600
```

## Usage
```javascript
const lcr600 = require('lcr600');
const LCR600 = new lcr600({
		hostAddress: 0xff,
		LCRNodeAddress: 0x01,
		port: "/dev/ttyUSB0",
		baud: 19200,
		debug: true
	});
```

## Configuration
|Field||Default|Description|
|---|---|---|---|
|hostAddress|Optional|0xff|Host address|
|LCRNodeAddress|Optional|0x00|LCR Node Address|
|port|Mandatory|-|Port used to communicate with LCR600|
|baud|Optional|19200|LCR600 Baud Rate|
|debug|Optional|false|Debugging Serial Communication|

## Example
```javascript
const config = {
	hostAddress: 0xff, // if this field is left empty, would be default to 0xff
	LCRNodeAddress: 0x01, // LCR address device used
	port: "/dev/ttyUSB0", // COM port where device is connected
	baud: 19200, // default baud rate for LCR 600
	debug: true // optional. Default to false
};

const lcr600 = require('lcr600');
const LCR600 = new lcr600(config, config.debug);

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
	console.log('data:', received);
	console.log('---------------------------------------');
});

// failed when parsing data, only contains code for debugging purpose
LCR600.on('failed', received => {
	console.error('failed:', received);
	console.log('---------------------------------------');
});

// switch pos changed
LCR600.on('switch', received => {
	console.log('switch:', received);
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

	// use setTimeout instead of setInterval due to async
	const __loop = async () => {
		await LCR600.getData('GrossCount_NE');
		setTimeout(__loop, interval);
	};

	// start infinite loop
	__loop();

})();
```


## FIELDS
|Field Name|Field Number|Type|
|---|---|---|
|ProductNumber_DL|0|LIST+0|
|ProductCode_DL|1|TEXT|
|GrossQty_NE|2|VOLUME|
|NetQty_NE|3|VOLUME|
|FlowRate_NE|4|VOLUME|
|ProductDescriptor_DL|11|TEXT|
|ShiftGross_NE|13|VOLUME|
|ShiftNet_NE|14|VOLUME|
|GrossTotal_WM|17|VOLUME|
|NetTotal_WM|18|VOLUME|
|UnitID_UL|24|TEXT|
|Temp_WM|33|SFLOAT|
|TempOffset_WM|34|SFLOAT|
|TempScale_WM|35|LIST+10|
|MeterID_WM|36|TEXT|
|QtyUnits_WM|38|LIST+4|
|Decimals_WM|39|LIST+14|
|FlowDirection_WM|40|LIST+21|
|TimeUnit_WM|41|LIST+11|
|CalibrationEvent_NE|42|LONG|
|ConfigurationEvent_NE|43|LONG|
|GrossCount_NE|44|VOLUME|
|NetCount_NE|45|VOLUME|
|AvgFlowRate|126|VOLUME|
|CompFlowRate|127|VOLUME|
<br>

## LIST TYPES
##### __LIST+4__
|Number|Description|
|---|---|
|1|LITRE|
|2|CUBIC METER|
|3|POUND|
|4|KILOGRAM|
|5|BARREL|
|6|(empty)|
<br>

##### __LIST+10__
|Number|Description|
|---|---|
|0|°C|
|1|°F|
<br>

##### __LIST+11__
|Number|Description|
|---|---|
|0|PER SECOND|
|1|PER MINUTE|
|2|PER HOUR|
<br>

##### __LIST+14__
|Number|Description|
|---|---|
|0|2 Digits|
|1|1 Digit|
|2|0 Digit|
<br>

##### __LIST+21__
|Number|Description|
|---|---|
|0|RIGHT|
|1|LEFT|