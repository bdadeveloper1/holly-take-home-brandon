
// This is a mapping of county names to their aliases. Common mappings are included from the job data.

export const countyAliases: { [key: string]: string } = {
  // Standard variations
  'san diego': 'san_diego',
  'san diego county': 'san_diego',
  'sandiego': 'san_diego',
  'sd': 'san_diego',

  'ventura': 'ventura',
  'ventura county': 'ventura',
  'vc': 'ventura',

  'los angeles': 'los angeles',
  'los angeles county': 'los angeles',
  'la': 'los angeles',
  'la county': 'los angeles',

  'santa barbara': 'santa barbara',
  'santa barbara county': 'santa barbara',
  'sb': 'santa barbara',

  'orange': 'orange',
  'orange county': 'orange',
  'oc': 'orange',

  'kern': 'kern',
  'kern county': 'kern',
  'kn': 'kern',

  'san bernardino': 'san_bernardino',
  'san bernardino county': 'san_bernardino',
  'sbc': 'san_bernardino',
  'sb county': 'san_bernardino'
}; 