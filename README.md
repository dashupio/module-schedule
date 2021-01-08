Dashup Module Application
&middot;
[![Latest Github release](https://img.shields.io/github/release/dashup/module-application.svg)](https://github.com/dashup/module-application/releases/latest)
=====

A connect interface for application on [dashup](https://dashup.io).

## Contents
* [Get Started](#get-started)
* [Connect interface](#connect)

## Get Started

This application connector adds applications functionality to Dashup applications:

```json
{
  "url" : "https://dashup.io",
  "key" : "[dashup module key here]"
}
```

To start the connection to dashup:

`npm run start`

## Deployment

1. `docker build -t dashup/module-application .`
2. `docker run -d -v /path/to/.dashup.json:/usr/src/module/.dashup.json dashup/module-application`