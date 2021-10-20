const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  var finalTags = null;
  const allProductTags = {};
  const allProducts = {};
  Tag.findAll()
  .then(tags => {
    finalTags = tags;
    // find productsTags
    tagIdsToQuery = {};
    tags.forEach(tag => tagIdsToQuery[tag.id] = tag);
    return ProductTag.findAll({where: {tag_id: Object.keys(tagIdsToQuery)}})
  })
  .then(productTags => {
    productTags.forEach(productTag => allProductTags[productTag.id] = productTag);
    // find products
    const productsToQuery = {};
    productTags.forEach(productTag => productsToQuery[productTag.product_id] = productTag);
    return Product.findAll({where: {id: Object.keys(productsToQuery)}});
  })
  .then(products => {
    products.forEach(product => allProducts[product.id] = product);

    var tagsToSend = [];
    var tagProducts = [];
    for (var j = 0; j < finalTags.length; j++) {
      var finalTag = finalTags[j];
      var tagId = finalTag.id;
      tagProducts = [];

      var productTags = Object.keys(allProductTags)
      .filter(productTagId => allProductTags[productTagId].tag_id == tagId)
      .map(productTagId => productTagId)

      var productsForTag = Object.keys(allProductTags)
      .filter(productTagId => allProductTags[productTagId].tag_id == tagId)
      .map(productTagId => allProducts[allProductTags[productTagId].product_id]);

      for (var i = 0; i < productsForTag.length; i++) {
        product = productsForTag[i];
        product_tag = allProductTags[productTags[i]]; // debug
        tagProducts.push({id: product.id, product_name: product.product_name, price: product.price,
        stock: product.stock, category_id: product.category_id, product_tag: {
          id: product_tag.id, product_id: product_tag.product_id, tag_id: product_tag.tag_id
        }});
        console.log(JSON.stringify(tagProducts));
      }
      tagsToSend.push({id: finalTag.id, tag_name: finalTag.tag_name, products: tagProducts})
  }
    res.status(200).json(tagsToSend);
  })
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
  
});

router.get('/:id', (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data

  var finalTag = null;
  const allProductTags = {};
  Tag.findOne({
    where: {
      id: req.params.id,
    },
  })
  .then(tag => {
    finalTag = tag;
    // find productsTags
    return ProductTag.findAll({where: {tag_id: req.params.id}})
  })
  .then(productTags => {
    productTags.forEach(productTag => allProductTags[productTag.product_id] = productTag);
    // find products
    return Product.findAll({where: {id: Object.keys(allProductTags)}});
  })
  .then(products => {
    allProducts = [];
    for (var i = 0; i < products.length; i++) {
      product = products[i];
      product_tag = allProductTags[product.id];
      allProducts.push({id: product.id, product_name: product.product_name, price: product.price,
      stock: product.stock, category_id: product.category_id, product_tag: {
        id: product_tag.id, product_id: product_tag.product_id, tag_id: product_tag.tag_id
      }});
    }
    res.status(200).json({id: finalTag.id, tag_name: finalTag.tag_name, products: allProducts});
  })
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
});

router.post('/', (req, res) => {
  // create a new tag
  Tag.create(req.body).then(tag => res.status(200).json(tag))
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  }).then((updatedTag) => res.json(updatedTag))
  .catch((err) => {
    // console.log(err);
    res.status(400).json(err);
  });
});

router.delete('/:id', (req, res) => {
  // delete on tag by its `id` value
  ProductTag.destroy({where: {tag_id: req.params.id}})
  .then((productTags) => {
    // remove productTags with this tag
    return Tag.destroy({where: {id: req.params.id,},})
  })
  .then((tag) => res.json(tag))
  .catch((err) => {
    // console.log(err);
    res.status(400).json(err);
  });
});

module.exports = router;
