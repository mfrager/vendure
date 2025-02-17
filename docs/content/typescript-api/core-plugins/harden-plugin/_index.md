---
title: "HardenPlugin"
weight: 10
date: 2023-06-21T06:23:40.862Z
showtoc: true
generated: true
---
<!-- This file was generated from the Vendure source. Do not modify. Instead, re-run the "docs:build" script -->

# HardenPlugin
<div class="symbol">


# HardenPlugin

{{< generation-info sourceFile="packages/harden-plugin/src/harden.plugin.ts" sourceLine="142" packageName="@vendure/harden-plugin">}}

The HardenPlugin hardens the Shop and Admin GraphQL APIs against attacks and abuse.

- It analyzes the complexity on incoming graphql queries and rejects queries that are too complex and
  could be used to overload the resources of the server.
- It disables dev-mode API features such as introspection and the GraphQL playground app.
- It removes field name suggestions to prevent trial-and-error schema sniffing.

It is a recommended plugin for all production configurations.

## Installation

`yarn add @vendure/harden-plugin`

or

`npm install @vendure/harden-plugin`

Then add the `HardenPlugin`, calling the `.init()` method with <a href='/typescript-api/core-plugins/harden-plugin/harden-plugin-options#hardenpluginoptions'>HardenPluginOptions</a>:

*Example*

```ts
import { HardenPlugin } from '@vendure/harden-plugin';

const config: VendureConfig = {
  // Add an instance of the plugin to the plugins array
  plugins: [
     HardenPlugin.init({
       maxQueryComplexity: 650,
       apiMode: process.env.APP_ENV === 'dev' ? 'dev' : 'prod',
     }),
  ],
};
```

## Setting the max query complexity

The `maxQueryComplexity` option determines how complex a query can be. The complexity of a query relates to how many, and how
deeply-nested are the fields being selected, and is intended to roughly correspond to the amount of server resources that would
be required to resolve that query.

The goal of this setting is to prevent attacks in which a malicious actor crafts a very complex query in order to overwhelm your
server resources. Here's an example of a request which would likely overwhelm a Vendure server:

```GraphQL
query EvilQuery {
  products {
    items {
      collections {
        productVariants {
          items {
            product {
              collections {
                productVariants {
                  items {
                    product {
                      variants {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

This evil query has a complexity score of 2,443,203 - much greater than the default of 1,000!

The complexity score is calculated by the [graphql-query-complexity library](https://www.npmjs.com/package/graphql-query-complexity),
and by default uses the <a href='/typescript-api/core-plugins/harden-plugin/default-vendure-complexity-estimator#defaultvendurecomplexityestimator'>defaultVendureComplexityEstimator</a>, which is tuned specifically to the Vendure Shop API.

The optimal max complexity score will vary depending on:

- The requirements of your storefront and other clients using the Shop API
- The resources available to your server

You should aim to set the maximum as low as possible while still being able to service all the requests required.
This will take some manual tuning.
While tuning the max, you can turn on the `logComplexityScore` to get a detailed breakdown of the complexity of each query, as well as how
that total score is derived from its child fields:

*Example*

```ts
import { HardenPlugin } from '@vendure/harden-plugin';

const config: VendureConfig = {
  // A detailed summary is logged at the "debug" level
  logger: new DefaultLogger({ level: LogLevel.Debug }),
  plugins: [
     HardenPlugin.init({
       maxQueryComplexity: 650,
       logComplexityScore: true,
     }),
  ],
};
```

With logging configured as above, the following query:

```GraphQL
query ProductList {
  products(options: { take: 5 }) {
    items {
      id
      name
      featuredAsset {
        preview
      }
    }
  }
}
```
will log the following breakdown:

```sh
debug 16/12/22, 14:12 - [HardenPlugin] Calculating complexity of [ProductList]
debug 16/12/22, 14:12 - [HardenPlugin] Product.id: ID!     childComplexity: 0, score: 1
debug 16/12/22, 14:12 - [HardenPlugin] Product.name: String!       childComplexity: 0, score: 1
debug 16/12/22, 14:12 - [HardenPlugin] Asset.preview: String!      childComplexity: 0, score: 1
debug 16/12/22, 14:12 - [HardenPlugin] Product.featuredAsset: Asset        childComplexity: 1, score: 2
debug 16/12/22, 14:12 - [HardenPlugin] ProductList.items: [Product!]!      childComplexity: 4, score: 20
debug 16/12/22, 14:12 - [HardenPlugin] Query.products: ProductList!        childComplexity: 20, score: 35
verbose 16/12/22, 14:12 - [HardenPlugin] Query complexity [ProductList]: 35
```

## Signature

```TypeScript
class HardenPlugin {
  static static options: HardenPluginOptions;
  static init(options: HardenPluginOptions) => ;
}
```
## Members

### options

{{< member-info kind="property" type="<a href='/typescript-api/core-plugins/harden-plugin/harden-plugin-options#hardenpluginoptions'>HardenPluginOptions</a>"  >}}

{{< member-description >}}{{< /member-description >}}

### init

{{< member-info kind="method" type="(options: <a href='/typescript-api/core-plugins/harden-plugin/harden-plugin-options#hardenpluginoptions'>HardenPluginOptions</a>) => "  >}}

{{< member-description >}}{{< /member-description >}}


</div>
