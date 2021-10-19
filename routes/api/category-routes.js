const router = require('express').Router();
const { Category, Product } = require('../../models');

// The `/api/categories` endpoint

router.get('/', async (req, res) => {
  // find all categories
  // be sure to include its associated Products

const categories = await Category.findAll();

res.json(categories);
});

router.get('/:id', async (req, res) => {
  // find one category by its `id` value
  // be sure to include its associated Products

  const category = await Category.findByPk( req.params.id );
});

router.post('/', async (req, res) => {
  // create a new category

  const category = await Category.create( req.body );
});

router.put('/:id', async (req, res) => {
  // update a category by its `id` value

  const category = await Category.belongsTo( req.body );

  {
    // Gets the books based on the isbn given in the request parameter
    
    where: {
      id: req.params.id,
    },
  } );
  
});

router.delete('/:id', async (req, res) => {
  // delete a category by its `id` value
  Category.destroy();
});

module.exports = router;
