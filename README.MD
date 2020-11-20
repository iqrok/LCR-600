# LCR API Currently Supported

## CONFIGURATION
```javascript
const config = {
        hostAddress: 0xff, // if this field is left empty, would be defaault to 0xff
        LCRNodeAddress: 0x01, // LCR address device used
        port: "/dev/ttyUSB0", // COM port where device is connected
        baud: 19200 // default baud rate for LCR 600
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
	console.dir('LIST', received);
});

LCR600.on('TEXT', received => {
	console.dir('TEXT', received);
});

LCR600.on('data', (received, data) => {
	console.log('data', received, data);
	console.log('---------------------------------------');
});

// failed when parsing data, only contains code for debugging purpose
LCR600.on('failed', received => {
	console.error('failed', received);
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

	console.log(LCR600.getAttribute());
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


## FIELD NUMBERS
|Field|Number|Type|
|---|---|---|
|ProductNumber_DL|0|LIST+0|
|ProductCode_DL|1|TEXT|,
|GrossQty_NE|2|VOLUME|,
|NetQty_NE|3|VOLUME|,
|FlowRate_NE|4|VOLUME|,
|ProductDescriptor_DL|11|TEXT|,
|ShiftGross_NE|13|VOLUME|,
|ShiftNet_NE|14|VOLUME|,
|GrossTotal_WM|17|VOLUME|,
|NetTotal_WM|18|VOLUME|,
|UnitID_UL|24|TEXT|,
|Temp_WM|33|SFLOAT|,
|TempOffset_WM|34|SFLOAT|,
|TempScale_WM|35|LIST+10|
|MeterID_WM|36|TEXT|,
|QtyUnits_WM|38|LIST+4|
|Decimals_WM|39|LIST+14|
|FlowDirection_WM|40|LIST+21|
|TimeUnit_WM|41|LIST+11|
|CalibrationEvent_NE|42|LONG|,
|ConfigurationEvent_NE|43|LONG|,
|GrossCount_NE|44|VOLUME|,
|NetCount_NE|45|VOLUME|,
|AvgFlowRate|126|VOLUME|,
|CompFlowRate|127|VOLUME|,

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

##### __LIST+10__
|Number|Description|
|---|---|
|0|°C|
|1|°F|
	
##### __LIST+11__
|Number|Description|
|---|---|
|0|PER SECOND|
|1|PER MINUTE|
|2|PER HOUR|
	
##### __LIST+14__
|Number|Description|
|---|---|
|0|2 Digits|
|1|1 Digit|
|2|0 Digit|
	
##### __LIST+21__
|Number|Description|
|---|---|
|0|RIGHT|
|1|LEFT|

## RETURN CODES
|Number|Description|
|---|---|
|0|The LCR request was completed successfully.|
|32|An invalid parameter ID was received by the LCR device.|
|33|An invalid field number was detected by the LCR device.|
|34|The LCR device detected that the field data received is not compatible with the field data type.|
|35|The requested field was not set due to the mode of the LCR.|
|36|An invalid command number was detected by the LCR device.|
|37|An invalid device address was detected by the LCR device.|
|38|The last request made to a LCR has been queued by the LCR.|
|39|The LCR has determined there is no queued request in the LCR.|
|40|The queued request in the LCR was successfully aborted.|
|41|The previous request to the LCR, which was queued and then aborted, is still being processed by the LCR.|
|42|The queued request in the LCR has reached a point in its processing where it can no longer be aborted.|
|43|An invalid parameter block number was requested by LCP02Open.|
|44|An invalid baud rate was requested by LCP02Open.|
|48|The START operation failed while accessing the flash memory.|
|49|No acknowledge was received while accessing flash memory.|
|50|A CRC error was detected by the flash memory access routines.|
|51|The flash memory access routines received invalid parameters from the calling application.|
|52|An attempt to write over a page boundary was detected by the flash memory access routines.|
|53|The data written to flash memory failed the read-back CRC test.|
|64|The A to D converter is returning a value that is greater than its maximum valid value.|
|65|The A to D converter is returning a value that is less than its maximum valid value.|
|67|The compensation type, Field #57, contains an invalid value.|
|68|The compensation parameter in Field #58 is out of its valid limit range.|
|69|The current temperature of the product being delivered is outside the allowed compensation range.|
|80|A NBS card setup error occurred.|
|81|A NBS card termination error occurred.|
|82|Connection with the specified device failed.|
|83|The message received by the C-API from the specified device was the incorrect size.|
|84|An invalid device number was detected by the C-API.|
|85|An invalid field number was detected by the C-API.|
|86|The C-API detected that the field data received is not compatible with the field data type.|
|87|An invalid command number was detected by the C-API.|
|88|There are no devices attached to the LCR network.|
|89|The major version number of the C-API does not match the major version number of all LCR devices in the network.|
|90|The DOS environment parameter string does not exist or contains invalid data.|
|91|The C-API has determined there is no queued request in a LCR.|
|92|The C-API has determined that a request is already queued in a LCR.|
|93|An invalid request code has been queued by the C-API.|
|94|Network communications has not been opened with a call to LCP02Open.|
|95|The network communications has already been opened.|
|96|The printer is busy.|
|97|The text string to be printed overflowed the print buffer.|
|98|The requested status from the printer was not returned from the printer within the allotted time.|
|112|The requested field has not been initialized in flash memory.|
|113|The new field data failed its range check.|
|114|The field data cannot be read from flash memory.|
|115|A gross preset delivery is not active.|
|116|A net preset delivery is not active.|
|117|Set operations are never allowed on the requested field.|
|118|The requested field is no longer used.|
|119|The current switch position does not allow the requested operation to be performed.|
|120|The current state of the LCR does not allow the requested operation to be performed.|
|121|The requested command was ignored due to a pending delivery ticket.|
|122|A write to flash memory was not allowed due to hardware protection via the switch on the LCR.|
|123|The entered flow rate for the current linearization point is already being used by another point. Duplicate flow rates are not allowed.|
|124|The percent error of two adjacent points differed by more than 0.25%.|
|125|The end of the transaction list has been reached.|
|126|The end of the transaction list has been reached and some transactions were lost due to the queue filling up before the transactions were retrieved.|
|127|The customer number has not been set correctly.|
|200|The low level LCP drivers are already installed.|
|201|An invalid name and revision string was received by the LCP drivers.|
|202|An invalid node address was received by the LCP drivers.|
|203|An invalid base communications address was received by the LCP drivers.|
|204|An invalid IRQ was received by the LCP drivers.|
|205|An invalid baud rate was received by the LCP drivers.|
|206|An invalid timeout value was received by the LCP drivers.|
|207|An invalid transmit enable bit was received by the LCP drivers.|
|208|A NULL pointer was passed as an address to the LCP drivers.|
|209|The LCR reported that no request was active.|
|210|The LCR did not respond within the timeout value specified.|
|211|The LCR aborted the last request.|
|212|The LCR reported that the request made is not supported.|
|213|The LCR reported a buffer overflow condition.|
|214|The LCR reported that it is busy working on the last request.|
|215|The LCP drivers are not installed.|
|216|The LCP drivers detected a dynamic memory allocation error.|
|217|The clock speed of the CPU was not set for the LCP drivers (obsolete).|
|218|The message size of the incoming message does not match the expected size.|
|219|There was a problem initializing WinSock.|
|220|Error initializing socket.|
|221|An invalid IP address has been passed in.|
|222|An invalid IP port number has been passed in.|
|223|The message with an invalid message ID has been received|