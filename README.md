# next-mission-control

An app to give an general overview of how our stack is performing, using metrics from the heroku dynos rather than graphite.

If you have an FT SSO account you can view it here: [http://missioncontrol.ft.com/].

## Development

The usual `n.Makefile` commands are used - `make build` `make test` etc.  `make run` will run the app on localhost:3002.

## config

There are some config files, written in yaml which allow customization of what we see ofr each app.  Only an app in `apps.yaml` will appear in the top list on the homepage.  You can then set different thresholds for this app.

## Todo

See [here](https://github.com/Financial-Times/next-mission-control/issues/10)
