import { writeFile, readFile } from 'fs';
import { execFile } from 'child_process';
import express from 'express';
import bodyParser from 'body-parser';
import tmp from 'tmp';
import cors from 'cors';
// import vm from 'vm';

import log from './lib/log';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(req.method, req.path, res.statusCode);
  next();
});

app.post('/submit-code', (req, res) => {

  console.log('da body', req.body);

  var testResults = req.body.testCases.slice();

  // var testResults =[];

  
  for (let i = 0; i < req.body.testCases.length; i++) {
    var funcWithTest = req.body.code + ` ${req.body.challengeTitle}(${req.body.testCases[i].content[1]})`;
      var result = eval(funcWithTest);
      testResults[i].content[3] = result;
    if (result === req.body.testCases[i].content[2]){
      testResults[i].content[4] = true;
      console.log(`test ${req.body.testCases[i].content[0]} passed`);
    } else {
      console.log(`test ${req.body.testCases[i].content[0]} failed`);
      testResults[i].content[4] = false;
    } 
  }

  //results to be sent back to client
  console.log('results', testResults);



  tmp.file({ postfix: '.js' }, (errCreatingTmpFile, path) => {
    writeFile(path, req.body.code, (errWritingFile) => {
      if (errWritingFile) {
        res.send(errWritingFile);
      } else {
        execFile('node', [path], (errExecutingFile, stdout, stderr) => {
          if (errExecutingFile) {
            let stderrFormatted = stderr.split('\n');
            stderrFormatted.shift();
            stderrFormatted = stderrFormatted.join('\n');
            console.log('stderrformatted', stderrFormatted);
            res.send(stderrFormatted);
          } else {
            console.log('stdout', stdout);
            // res.write(JSON.stringify(stdout));
            res.send({stdout: JSON.stringify(stdout), testResults: testResults});
          }
        });
      }
    });
  });
});

app.listen(PORT, log(`coderunner-service is listening on port ${PORT}`));
