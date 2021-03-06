## Test Integration
#### Installation
The easiest way to install this integration is to use KPM.
```sh
/kpm install test
```

#### Configuration
The test integration requires no configuration. It is designed to provide a testing ground to experiment with your modules before using them live in one of the service integrations.

Some testing parameters can be configured using the following commands:
```shell
/kpm config test threadId "<someThreadID>"
/kpm config test senderId "<someSenderID>"
/kpm config test historySize 1024
/kpm config test senderName "TESTING"
```

Additional special commands exist in test that are not in any other integration:
- `set senderName <userName>`
- `set senderId <senderId>`
- `set threadId <threadId>`
- `set logLevel <logLevel>`

#### Running
To run Test, either run `node main.js test` when starting Concierge or run `/kpm start test` when Concierge is running. If no integrations are specified on Conceierge startup, `test` will be used by default.
