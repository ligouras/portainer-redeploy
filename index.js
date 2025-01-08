const axios = require("axios");
const core = require('@actions/core');
const csvparse = require('csv-parse/lib/sync');
const github = require('@actions/github');

async function getInputList(name, ignoreComma) {
    const res = [];
    const items = core.getInput(name);
    if (items == '') {
        return res;
    }
    for (const output of (await csvparse(items, {
        columns: false,
        relax: true,
        relaxColumnCount: true,
        skipLinesWithEmptyValues: true
    }))) {
        if (output.length == 1) {
            res.push(output[0]);
            continue;
        }
        else if (!ignoreComma) {
            res.push(...output);
            continue;
        }
        res.push(output.join(','));
    }
    return res.filter(item => item).map(pat => pat.trim());
}

const main = async () => {
  try {
    const portainerHost = core.getInput('portainer-host', {
      required: true
    });

    const accessToken = core.getInput('access-token', {
      required: true
    });

    const endpointId = core.getInput('endpoint-id', {
      required: false
    });

    if (!endpointId) {
      const endpoints = await axios.get(`${portainerHost}/api/endpoints`, {
        headers: {
          'X-API-Key': accessToken
        }
      });

      const endpoint = endpoints.data.find(endpoint => endpoint.Name == 'local');
      if (!endpoint) {
        endpointId = endpoints.data[0].Id;
      } else {
        endpointId = endpoint.Id;
      }
    }

    const stackName = core.getInput('stack-name', {
      required: true
    });
    const stackEnv = await getInputList('stack-env', true);

    const newEnv = stackEnv.map(env => {
      const [name, ...value] = env.split('=');
      return {
        name: name,
        value: value.join('=')
      };
    });

    const stacks = await axios.get(`${portainerHost}/api/stacks`, {
      headers: {
        'X-API-Key': accessToken
      }
    });

    const stack = stacks.data.find(stack => stack.Name == stackName);
    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const stop = await axios.post(`${portainerHost}/api/stacks/${stack.Id}/stop`, {}, {
      headers: {
        'X-API-Key': accessToken
      }
    }).catch(function (error) {
      if (error.response.status == 400) {
        return error.response;
      }
      throw error;
    });

    if (stop.status == 400) {
        console.log(`Stack ${stackName} is not running`);
    } else {
        console.log(`Stack ${stackName} stopped!`);
    }

    const file = await axios.get(`${portainerHost}/api/stacks/${stack.Id}/file`, {
      headers: {
        'X-API-Key': accessToken
      }
    });

    const deploy = await axios.put(`${portainerHost}/api/stacks/${stack.Id}?endpointId=${endpointId}`, {
      env: stack.Env.filter(env => !newEnv.find(newEnv => newEnv.name == env.name)).concat(newEnv),
      prune: true,
      StackFileContent: file.data.StackFileContent
    }, {
      headers: {
        'X-API-Key': accessToken
      }
    });

    console.log(`Stack ${stackName} updated:`);
    console.log(JSON.stringify(deploy.data, null, 4));

  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
