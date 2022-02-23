/* eslint-disable arrow-body-style */
/* eslint-disable comma-dangle */
import cookieParser from 'cookie-parser';
import express, { urlencoded } from 'express';
import methodOverride from 'method-override';

import { read, add, edit, write } from './jsonFileStorage.js';

const app = express();
const port = process.argv[2];

app.set('view engine', 'ejs');
// to use 'public' folder
app.use(express.static('public'));
// to use req.body
app.use(urlencoded({ extended: false }));
// to use DEL or PUSH
app.use(methodOverride('_method'));
// to parse cooking string from req into an obj
app.use(cookieParser());

const capFirstLetter = (string) => {
  return string[0].toUpperCase() + string.slice(1);
};

// render form
app.get('/sighting', (req, res) => {
  res.render('form');
});

// add form data to DB
app.post('/sighting', (req, res) => {
  // make a copy of the req.body
  const data = { ...req.body };
  // change shape to lowercase
  data.shape = req.body.shape.toLowerCase();
  const d = new Date();
  // add year of form submit
  data.year = d.getFullYear();
  // add month of form submit
  data.month = d.getMonth() + 1;
  // add day of form submit
  data.day = d.getDay();

  add('data.json', 'sightings', data, (err) => {
    if (err) {
      console.log('Add error', err);
    }
    res.status(200).redirect('/');
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
    res.render('singleSighting', { sightingsObj, index });
  });
});

// favorite page
app.get('/favorites', (req, res) => {
  // get favorited sighting from query
  const { favorite } = req.query;
  // add a cookie to store favorites
  res.cookie('favorite', favorite);
  // redirect back to index page
  res.redirect('/');
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

// render a list of sightings (index page) DOING
app.get('/', (req, res) => {
  // setting the cookie for tracking number of visits to the site
  res.cookie('visits', 0);
  // incrementing the number visits
  let visits = 0;
  if (req.cookies.visits) {
    visits = Number(req.cookies.visits);
  }
  visits += 1;
  // res.clearCookie('visits');
  // updates the cookie with the new value
  res.cookie('visits', visits);

  // retrieve 'favorite' cookie and store in var
  const favoriteSightings = [Number(req.cookies.favorite)];
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read error:', err);
    }
    // get query data
    const sightingQuery = req.query.sighting;
    // sort by shape
    if (sightingQuery === 'shape') {
      content.sightings.sort((a, b) => {
        return a.shape > b.shape ? 1 : -1;
      });
    }
    if (sightingQuery === 'city') {
      content.sightings.sort((a, b) => {
        return a.city > b.city ? 1 : -1;
      });
    }
    if (sightingQuery === 'state') {
      content.sightings.sort((a, b) => {
        return a.state > b.state ? 1 : -1;
      });
    }
    if (sightingQuery === 'date_time') {
      content.sightings.sort((a, b) => {
        return a.date_time > b.date_time ? 1 : -1;
      });
    }
    const { sightings } = content;
    res.render('index', { sightings, visits, favoriteSightings });
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

// render list of shapes
app.get('/shapes', (req, res) => {
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read error: ', err);
    }
    const listOfShapes = [];
    content.sightings.forEach((sighting) => {
      listOfShapes.push(sighting.shape);
    });
    const noDupesList = [...new Set(listOfShapes)];
    res.render('shapes', { noDupesList });
  });
});

// render list of specified shapes
app.get('/shapes/:shape', (req, res) => {
  const { shape } = req.params;
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read error: ', err);
    }

    const filteredList = content.sightings.filter((sighting, index) => {
      if (sighting.shape === shape) {
        // add index of item in DB to obj
        sighting.index = index;
        return sighting.shape;
      }
    });
    filteredList.shape = shape.toLowerCase();
    res.render('singleShape', { filteredList });
  });
});

app.listen(port);
