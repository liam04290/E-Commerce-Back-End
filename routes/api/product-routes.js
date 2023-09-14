const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [Category, Tag],
    });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [Category, Tag],
    });
    if (!product) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.product_name || !req.body.price || !req.body.stock) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newProduct = await Product.create(req.body);
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: newProduct.id,
          tag_id,
        };
      });
      await ProductTag.bulkCreate(productTagIdArr);
    }
    
    res.status(201).json(newProduct);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!req.body.product_name || !req.body.price || !req.body.stock) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const updatedProduct = await Product.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    
    if (req.body.tagIds && req.body.tagIds.length) {
      const existingProductTags = await ProductTag.findAll({
        where: { product_id: req.params.id },
      });
      
      const existingTagIds = existingProductTags.map(({ tag_id }) => tag_id);
      const newProductTags = req.body.tagIds.filter(
        (tag_id) => !existingTagIds.includes(tag_id)
      );
      
      const removedProductTags = existingProductTags.filter(
        ({ tag_id }) => !req.body.tagIds.includes(tag_id)
      );
      
      await ProductTag.bulkCreate(
        newProductTags.map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        })
      );
      
      await ProductTag.destroy({
        where: { id: removedProductTags.map(({ id }) => id) },
      });
    }
    
    res.status(200).json(updatedProduct);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (!deletedProduct) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }
    res.status(200).json(deletedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
