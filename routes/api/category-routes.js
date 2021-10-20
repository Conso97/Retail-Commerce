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
  res.json(category);
});

router.post('/', async (req, res) => {
  // create a new category

  const category = await Category.create({id: req.params.id, category_name: req.body.category_name});
  res.json(category);
});

router.put('/:id', async (req, res) => {
  // update a category by its `id` value

  const category = await Category.findByPk( req.params.id );
  category.category_name = req.body.category_name;

  const result = await category.save();
  res.json(result);
});

router.delete('/:id', async (req, res) => {
  // delete a category by its `id` value
  const category = await Category.findByPk( req.params.id );
  const result = await category.destroy();
  res.json(result);
});

module.exports = router;
