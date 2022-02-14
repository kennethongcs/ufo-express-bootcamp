/* eslint-disable comma-dangle */
import express, { urlencoded } from 'express';
import methodOverride from 'method-override';
import { read, add, edit } from './jsonFileStorage.js';

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

// render form to edit a single sighting DOING
app.get('/sighting/:index/edit', (req, res) => {
  const { index } = req.params;
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read error: ', err);
    }
    const sighting = content.sightings[index];
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

app.listen(3004);
