const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint
var allProducts = null;
const allProductTagIds = {};

// get all products
router.get('/', (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  Product.findAll().then(products => {
    
    allProducts = products;
    // get the tags for each product
    const productIds = products.map(product => product.id);
    return ProductTag.findAll({ where: { product_id: productIds } });
  })
  .then((productTags) => {
    
    const tagsToQuery = {};
    for (var i = 0; i < allProducts.length; i++) {
      const tagsForProduct = productTags.filter(productTag => productTag.product_id == allProducts[i].dataValues.id)
                                                .map(productTag => ({"id" : productTag.id, 
                                                "tag_id" :  productTag.tag_id, 
                                                "product_id" : productTag.product_id}));

      // add tag_ids to list of tags to query
      tagsForProduct.forEach(tag => allProductTagIds[tag.id] = tag);
      tagsForProduct.forEach(tag => tagsToQuery[tag.tag_id] = tag);
      allProducts[i].dataValues.tags = tagsForProduct;
    }
    
    return Tag.findAll({ where: { id: Object.keys(tagsToQuery) } });
    
  })
  .then(tags => {
    
    var tagMap = {}
    tags.forEach(tag => tagMap[tag.id] = tag);

    // update tag and productTag for product
    for (var i = 0; i < allProducts.length; i++) {
      var productTags = [];
      var productTagIds = allProducts[i].dataValues.tags;
      for (var j = 0; j < productTagIds.length; j++) {
        var productTagId = productTagIds[j];
        var pt = tagMap[productTagId.tag_id];
        productTags.push({id: pt.id, tag_name: pt.tag_name, product_tag: allProductTagIds[productTagId.id]})
      }
      allProducts[i].dataValues.tags = productTags;
    }
    
    var categoryIds = {}
    allProducts.forEach(product => categoryIds[product.dataValues.category_id] = product);
    return Category.findAll({where: {id: Object.keys(categoryIds)}});
  })
  .then(categories => {
    // add categories
    var categoryMap = {};
    categories.forEach(category => categoryMap[category.id] = category);

    for (var i = 0; i < allProducts.length; i++) {
      var categoryId =  allProducts[i].dataValues.category_id;
      allProducts[i].dataValues.category = categoryMap[categoryId];
      delete allProducts[i].dataValues["categoryId"]; // this is redundant 
    }

    res.status(200).json(allProducts);
  })
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
});

// get one product
router.get('/:id', (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data

  var finalProduct = null;
  const allProductTagIds = {};

  Product.findOne({
    where: {
      id: req.params.id,
    },
  })
.then(product => {
    
    finalProduct = product;
    // get the tags for product
    return ProductTag.findAll({ where: { product_id: product.id } });
  })
  .then((productTags) => {
    
    const tagsForProduct = productTags.map(productTag => ({"id" : productTag.id, 
                                          "tag_id" :  productTag.tag_id, 
                                          "product_id" : productTag.product_id}));

    // add tag_ids to list of tags to query
    tagsForProduct.forEach(tag => allProductTagIds[tag.id] = tag);
    finalProduct.dataValues.tags = tagsForProduct;

    var tagsToQuery = {};
    tagsForProduct.forEach(tag => tagsToQuery[tag.tag_id] = tag);
    
    return Tag.findAll({ where: { id: Object.keys(tagsToQuery) } });
    
  })
  .then(tags => {
    
    var tagMap = {}
    tags.forEach(tag => tagMap[tag.id] = tag);

    // update tag and productTag for product
    var productTags = [];
    var productTagIds = finalProduct.dataValues.tags;
    for (var j = 0; j < productTagIds.length; j++) {
      var productTagId = productTagIds[j];
      var pt = tagMap[productTagId.tag_id];
      productTags.push({id: pt.id, tag_name: pt.tag_name, product_tag: allProductTagIds[productTagId.id]})
    }
    finalProduct.dataValues.tags = productTags;
    return Category.findOne({where: {id: finalProduct.dataValues.category_id}});
  })
  .then(category => {
    // add category
    finalProduct.dataValues.category = category;
    delete finalProduct.dataValues["categoryId"]; // this is redundant 

    res.status(200).json(finalProduct);
  })
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
});


// create new product
router.post('/', (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  var productTagsToRemove = null;

  // find all associated tags from ProductTag
  ProductTag.findAll({ where: { product_id: req.params.id } })
  .then((productTags) => {

    // remove associated product tags
    productTagsToRemove = productTags
      .map(pt => pt.id);

    console.log("productTags " + JSON.stringify(productTags));
    console.log("productTagsToRemove " + JSON.stringify(productTagsToRemove));

    return Product.destroy({where: {id: req.params.id}});
  })
  .then((product) => {
    // delete productTags
    return ProductTag.destroy({ where: { id: productTagsToRemove } });
  })
  .then((updatedProductTags) => res.json(updatedProductTags))
  .catch((err) => {
    // console.log(err);
    res.status(400).json(err);
  });
});

module.exports = router;
