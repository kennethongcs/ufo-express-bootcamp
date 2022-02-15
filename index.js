/* eslint-disable comma-dangle */
import express, { urlencoded } from 'express';
import methodOverride from 'method-override';
import { read, add, edit, write } from './jsonFileStorage.js';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// render form
app.get('/sighting', (req, res) => {
  res.render('form');
});

// add form data to DB
app.post('/sighting', (req, res) => {
  add('data.json', 'sightings', req.body, (err) => {
    if (err) {
      console.log('Add error', err);
    }
    res.status(200);
  });
});

// render a single sighting
app.get('/sighting/:index', (req, res) => {
  read('data.json', (err, content) => {
    const sightings = content.sightings[req.params.index];
    const { index } = req.params;
    if (err) {
      console.log('Read error:', err);
    }
    const sightingsObj = {
      sightings,
      index,
    };
    res.render('singleSighting', { sightingsObj });
  });
});

// render form to edit a single sighting
app.get('/sighting/:index/edit', (req, res) => {
  const { index } = req.params;
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read error: ', err);
    }
    // get the sighting data from content
    const sighting = content.sightings[index];
    // add index value to sighting
    sighting.index = index;
    // add index obj for ejs template to reference
    res.render('singleEdit', { sighting });
  });
});

// add edited data to DB
app.put('/sighting/:index', (req, res) => {
  edit(
    'data.json',
    (err, content) => {
      const { index } = req.params;
      const { sightings } = content;
      if (err) {
        console.log('Edit error: ', err);
      }
      // replace content at index with new form data
      if (!err) {
        sightings[index] = req.body;
      }
    },
    // add callback function for write function
    (err) => {
      if (err) {
        console.log('Write error: ', err);
      }
      // after writing, send status 200 and redirect back to index
      res.status(200).redirect('/');
    }
  );
});

// render a list of sightings
app.get('/', (req, res) => {
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read error:', err);
    }
    const { sightings } = content;

    res.render('index', { sightings });
  });
});

app.get('/sighting/:index/delete', (req, res) => {
  const { index } = req.params;
  res.render('singleDelete', { index });
});
// delete a sighting
app.delete('/sighting/:index', (req, res) => {
  const { index } = req.params;
  read('data.json', (err, content) => {
    content.sightings.splice(index, 1);
    write('data.json', content, (err) => {
      // after writing, send 'sighting deleted'
      res.send('Sighting Deleted');
    });
  });
});

app.listen(3004);
