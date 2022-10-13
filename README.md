# MetaDexa - Trading API 
In the current repository, there is a simple NodeJS server which serves as a trading API. You can ping one of the routes and get the best aggregated quotes for given trading pair.

## Installation 

``` bash
1. git clone https://github.com/MetaDexa/metadexa-api.git 
2. cd ../path_to_folder/metadexa-api (Navigate to the project root folder and run)
3. npm install 
```

## Usage 

``` bash
1. cd ../path_to_folder/metadexa-api (Navigate to the project root folder and run)
2. npm run start 
```

## Default System Health Status API

- `${host}/api/status/system` - Return the system information in response
- `${host}/api/status/time` - Return the current time in response
- `${host}/api/status/usage` - Return the process and system memory usage in response
- `${host}/api/status/process` -  Return the process details in response
- `${host}/api/status/error` - Return the error generated object in response

## Contributing 
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.


## License 
[MIT License](https://choosealicense.com/licenses/mit/)
