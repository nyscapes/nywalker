class App
  namespace '/api/v1' do

    configure do
      mime_type :api_json, 'application/vnd.api+json'
    end

    helpers do
      def parse_request_body
        return unless request.body.respond_to?(:size) &&
          request.body.size > 0

        halt 415 unless request.content_type &&
          request.content_type[/^[^;]+/] == mime_type(:api_json)

        request.body.rewind
        JSON.parse(request.body.read, symbolize_names: true)
      end

      def serialize_models(models, options = {})
        options[:is_collection] = true
        JSONAPI::Serializer.serialize(models, options)
      end

      def serialize_model(model, options = {})
        options[:is_collection] = false
        options[:skip_collection_check] = true
        JSONAPI::Serializer.serialize(model, options)
      end

    end

    before do
      halt 406 unless request.preferred_type.entry == mime_type(:api_json)
      @data = parse_request_body
      content_type :api_json
    end

  # Books
    get '/books' do
      Book.to_json
    end

  # Instances

  # Places

  # INDEX
    get '/places' do
      if params[:slug]
        place = Place.where(slug: params[:slug]).first
        not_found if place.nil?
        serialize_model(place, include: 'nicknames').to_json
      else 
        if params[:name]
          places = Place.where(name: /#{params[:name]}/i)
        else
          places = Place.all
        end
        places = places.sort_by{ |p| p.instance_count }.reverse
        serialize_models(places).to_json
      end
    end

  # AUTH

    post '/token' do
      puts request.body
      status 200
      "hi"
    end

    
  end
end
