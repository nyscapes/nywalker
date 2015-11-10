class App
  module Views

    class PlacesShow < Layout
      include ViewHelpers

      def places
        @places.map{ |p| { slug: p.slug, lat: p.lat, lon: p.lon, name: p.name } }
      end

    end
  end
end
