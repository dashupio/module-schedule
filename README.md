Dashup Module Schedule
&middot;
[![Latest Github release](https://img.shields.io/github/release/dashup/module-schedule.svg)](https://github.com/dashup/module-schedule/releases/latest)
=====

A connect interface for schedule on [dashup](https://dashup.io).

## Contents
* [Get Started](#get-started)
* [Connect interface](#connect)

## Get Started

This schedule connector adds schedules functionality to Dashup schedules:

```json
{
  "url" : "https://dashup.io",
  "key" : "[dashup module key here]"
}
```

To start the connection to dashup:

`npm run start`

## Deployment

1. `docker build -t dashup/module-schedule .`
2. `docker run -d -v /path/to/.dashup.json:/usr/src/module/.dashup.json dashup/module-schedule`